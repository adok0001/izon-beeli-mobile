// forked from design-sync lib/bundle.mjs — React Native port.
// WHAT CHANGES: only esbuild *resolution/transform* options in
// sharedBuildOptions (react-native→react-native-web alias, NativeWind
// jsx-runtime, web shims for native-only modules, font loaders). The output
// CONTRACT is untouched: stampHeader, reactShim, the IIFE-at-window.<GLOBAL>
// shape + footer, and bundleExportEvidence's semantics are re-exported / copied
// verbatim from the bundled lib so the app self-check still parses the result.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { IIFE_IMPORT_META_DEFINE } from '../../.ds-sync/lib/common.mjs';
import { reactShim, tsconfigPathsPlugin } from '../../.ds-sync/lib/bundle.mjs';

// Contract-defining helpers pass through unchanged.
export { resolveDistEntry, reactShim, tsconfigPathsPlugin, stampHeader } from '../../.ds-sync/lib/bundle.mjs';

// ── React Native → web shims ───────────────────────────────────────────────
// Components in this DS import react-native, expo-*, clerk, i18next, router,
// reanimated etc. None of those resolve to anything renderable in a headless
// browser, so each gets a minimal web shim. Wrappers (LinearGradient, BlurView,
// Animated.View, GestureHandlerRootView…) pass children through so layout
// survives; data/navigation/auth hooks return safe inert defaults so a static
// render never crashes. react-query + the app's own data hooks stay REAL — the
// preview supplies a seeded QueryClient (cfg.provider) so cards render content.
const SHIMS = {
  'react-native-safe-area-context': `
const React=require('react');const RNW=require('react-native-web');
const pass=(p)=>React.createElement(React.Fragment,null,p&&p.children);
const insets={top:0,bottom:0,left:0,right:0};
exports.SafeAreaProvider=pass;exports.SafeAreaView=RNW.View;
exports.SafeAreaInsetsContext=React.createContext(insets);
exports.SafeAreaFrameContext=React.createContext({x:0,y:0,width:0,height:0});
exports.useSafeAreaInsets=()=>insets;exports.useSafeAreaFrame=()=>({x:0,y:0,width:0,height:0});
exports.initialWindowMetrics={insets,frame:{x:0,y:0,width:0,height:0}};exports.withSafeAreaInsets=(C)=>C;`,

  'expo-router': `
const React=require('react');const noop=()=>{};
const router={push:noop,replace:noop,back:noop,navigate:noop,setParams:noop,dismiss:noop,dismissAll:noop,dismissTo:noop,reload:noop,prefetch:noop,canGoBack:()=>false,canDismiss:()=>false};
exports.useRouter=()=>router;exports.router=router;
exports.useLocalSearchParams=()=>({});exports.useGlobalSearchParams=()=>({});
exports.usePathname=()=>"/";exports.useSegments=()=>[];exports.useFocusEffect=()=>{};
exports.useNavigation=()=>({navigate:noop,goBack:noop,setOptions:noop,addListener:()=>noop});
exports.useRootNavigationState=()=>({});
const pass=(p)=>React.createElement(React.Fragment,null,p&&p.children);
exports.Link=pass;exports.Redirect=()=>null;exports.Slot=pass;
exports.Stack=pass;exports.Stack.Screen=()=>null;exports.Tabs=pass;exports.Tabs.Screen=()=>null;
exports.SplashScreen={hide:noop,preventAutoHideAsync:async()=>{}};`,

  '@clerk/clerk-expo': `
const React=require('react');const noop=()=>{};
// Signed-in preview user so auth-gated queries (enabled: !!isSignedIn) run and
// read their seeded cache; getToken is never hit (seeded data is staleTime:Infinity).
exports.useAuth=()=>({isLoaded:true,isSignedIn:true,userId:"preview_user",sessionId:"preview_session",orgId:null,getToken:async()=>null,signOut:async()=>{}});
exports.useUser=()=>({isLoaded:true,isSignedIn:true,user:{id:"preview_user",firstName:"Preview",fullName:"Preview User",imageUrl:""}});
exports.useClerk=()=>({signOut:async()=>{},openSignIn:noop});
exports.useSession=()=>({isLoaded:true,session:null});
const pass=(p)=>React.createElement(React.Fragment,null,p&&p.children);
exports.ClerkProvider=pass;exports.ClerkLoaded=pass;exports.SignedIn=()=>null;exports.SignedOut=pass;`,

  'expo-linear-gradient': `
const React=require('react');const {View}=require('react-native-web');
const flat=(s)=>Array.isArray(s)?Object.assign({},...s.filter(Boolean)):s;
exports.LinearGradient=(p)=>React.createElement(View,{style:[{backgroundColor:(p&&p.colors&&p.colors[0])||'transparent'},flat(p&&p.style)]},p&&p.children);`,

  'expo-blur': `
const React=require('react');const {View}=require('react-native-web');
exports.BlurView=(p)=>React.createElement(View,{style:p&&p.style},p&&p.children);`,

  'expo-image': `
const React=require('react');const {Image,View}=require('react-native-web');
exports.Image=(p)=>p&&p.source?React.createElement(Image,{source:p.source,style:p.style}):React.createElement(View,{style:p&&p.style});`,

  'expo-font': `
exports.useFonts=()=>[true,null];exports.loadAsync=async()=>{};exports.isLoaded=()=>true;
exports.Font={isLoaded:()=>true,loadAsync:async()=>{}};`,

  '@react-native-async-storage/async-storage': `
exports.default={getItem:async()=>null,setItem:async()=>{},removeItem:async()=>{},multiGet:async()=>[],multiSet:async()=>{},clear:async()=>{},getAllKeys:async()=>[]};`,

  'react-native-reanimated': `
const React=require('react');const RNW=require('react-native-web');
const Animated=new Proxy({View:RNW.View,Text:RNW.Text,ScrollView:RNW.ScrollView,Image:RNW.Image,FlatList:RNW.FlatList,createAnimatedComponent:(C)=>C},{get(t,k){return k in t?t[k]:(RNW[k]||RNW.View);}});
module.exports=Animated;module.exports.default=Animated;
module.exports.useSharedValue=(v)=>({value:v});module.exports.useAnimatedStyle=()=>({});
module.exports.useDerivedValue=(f)=>({value:typeof f==='function'?f():f});module.exports.useAnimatedRef=()=>({current:null});
module.exports.useAnimatedScrollHandler=()=>(()=>{});module.exports.useAnimatedProps=()=>({});
module.exports.withTiming=(v)=>v;module.exports.withSpring=(v)=>v;module.exports.withDelay=(_,v)=>v;module.exports.withRepeat=(v)=>v;module.exports.withSequence=(...a)=>a[a.length-1];
module.exports.interpolate=()=>0;module.exports.interpolateColor=()=>'transparent';
module.exports.Easing=new Proxy({},{get:()=>(x)=>x});
module.exports.runOnJS=(f)=>f;module.exports.runOnUI=(f)=>f;module.exports.cancelAnimation=()=>{};
const ent=new Proxy(function(){return ent;},{get:()=>ent});
['FadeIn','FadeOut','FadeInDown','FadeInUp','FadeOutDown','FadeOutUp','SlideInDown','SlideInUp','SlideInRight','SlideInLeft','SlideOutLeft','SlideOutRight','ZoomIn','ZoomOut','Layout','LinearTransition','CurvedTransition'].forEach(n=>{module.exports[n]=ent;});`,

  'react-native-gesture-handler': `
const React=require('react');const RNW=require('react-native-web');
exports.GestureHandlerRootView=(p)=>React.createElement(RNW.View,{style:p&&p.style},p&&p.children);
exports.GestureDetector=(p)=>React.createElement(React.Fragment,null,p&&p.children);
exports.ScrollView=RNW.ScrollView;exports.FlatList=RNW.FlatList;
exports.RectButton=(p)=>React.createElement(RNW.Pressable,p,p&&p.children);exports.BorderlessButton=exports.RectButton;
exports.TouchableOpacity=RNW.TouchableOpacity||RNW.Pressable;exports.TouchableHighlight=RNW.TouchableOpacity||RNW.Pressable;
const chain=new Proxy(function(){return chain;},{get:()=>()=>chain});
exports.Gesture=new Proxy({},{get:()=>()=>chain});exports.State={};exports.Directions={};`,

};

// @expo/vector-icons: deterministic placeholder glyph (sized/colored rounded
// box) sized & tinted by props. Handled outside SHIMS so subpath default
// imports (`@expo/vector-icons/MaterialIcons`) export the COMPONENT as default,
// while the bare import exposes the named icon sets.
const ICON_MAKE = `const React=require('react');const {View}=require('react-native-web');
const make=()=>(p)=>{const s=(p&&p.size)||24;return React.createElement(View,{style:[{width:s,height:s,borderRadius:Math.max(3,s*0.18),backgroundColor:(p&&p.color)||'#9A9480',opacity:0.9},p&&p.style]});};`;
const ICON_BARE = ICON_MAKE + `
exports.__esModule=true;
['MaterialIcons','MaterialCommunityIcons','Ionicons','FontAwesome','FontAwesome5','FontAwesome6','Feather','AntDesign','Entypo','EvilIcons','Fontisto','Foundation','Octicons','SimpleLineIcons','Zocial'].forEach(n=>exports[n]=make());
exports.createIconSet=()=>make();exports.createIconSetFromIcoMoon=()=>make();exports.default=make();`;
const ICON_SUB = ICON_MAKE + `
const C=make();module.exports=C;module.exports.default=C;module.exports.__esModule=true;`;

// Modules whose every member is inert (fire-and-forget APIs). Any property is a
// no-op function; defaults too.
const NULL_MODS = new Set([
  'expo-haptics', 'expo-secure-store', 'expo-clipboard', 'expo-sharing', 'expo-file-system',
  'expo-notifications', 'expo-av', 'expo-constants', 'expo-device', 'expo-application',
  'expo-localization', 'expo-store-review', 'expo-web-browser', 'expo-linking', 'expo-status-bar',
  'expo-screen-orientation', 'expo-keep-awake', 'expo-tracking-transparency', 'expo-updates',
  'expo-speech', 'expo-audio', 'expo-video',
  'react-native-view-shot',
]);
const NULL_PROXY = 'module.exports=new Proxy(function(){return null;},{get:()=>()=>null});';
const CODEGEN = 'module.exports=function(){return function(){return null};};module.exports.default=module.exports;';

// Shim onLoad's resolveDir must be a real dir so its `require('react')` /
// `require('react-native-web')` resolve from node_modules.
const rnPluginFixed = {
  name: 'rn-web-shims',
  setup(b) {
    const root = process.env.DS_RN_RESOLVE_DIR || process.cwd();
    for (const [mod] of Object.entries(SHIMS)) {
      // Match the module and any subpath (e.g. @expo/vector-icons/MaterialIcons),
      // all routed to the same web shim.
      const rx = new RegExp(`^${mod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/.*)?$`);
      b.onResolve({ filter: rx }, () => ({ path: mod, namespace: 'rn-shim' }));
    }
    for (const mod of NULL_MODS) {
      const rx = new RegExp(`^${mod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/.*)?$`);
      b.onResolve({ filter: rx }, (a) => ({ path: a.path, namespace: 'rn-null' }));
    }
    b.onResolve({ filter: /Libraries\/Utilities\/codegenNativeComponent/ }, (a) => ({ path: a.path, namespace: 'rn-codegen' }));
    // @expo/vector-icons — bare (named sets) vs subpath (component default).
    b.onResolve({ filter: /^@expo\/vector-icons$/ }, () => ({ path: 'veci', namespace: 'rn-veci-bare' }));
    b.onResolve({ filter: /^@expo\/vector-icons\/.+/ }, (a) => ({ path: a.path, namespace: 'rn-veci-sub' }));
    b.onLoad({ filter: /.*/, namespace: 'rn-shim' }, (a) => ({ contents: SHIMS[a.path], loader: 'js', resolveDir: root }));
    b.onLoad({ filter: /.*/, namespace: 'rn-null' }, () => ({ contents: NULL_PROXY, loader: 'js' }));
    b.onLoad({ filter: /.*/, namespace: 'rn-codegen' }, () => ({ contents: CODEGEN, loader: 'js' }));
    b.onLoad({ filter: /.*/, namespace: 'rn-veci-bare' }, () => ({ contents: ICON_BARE, loader: 'js', resolveDir: root }));
    b.onLoad({ filter: /.*/, namespace: 'rn-veci-sub' }, () => ({ contents: ICON_SUB, loader: 'js', resolveDir: root }));
  },
};

function sharedBuildOptions({ nodePaths, tsconfig }) {
  const pathsPlugin = tsconfig ? tsconfigPathsPlugin(tsconfig) : null;
  const plugins = [reactShim, rnPluginFixed];
  if (pathsPlugin) plugins.unshift(pathsPlugin);
  return {
    bundle: true,
    platform: 'browser',
    target: 'es2020',
    nodePaths: [nodePaths],
    plugins,
    metafile: true,
    alias: { 'react-native': 'react-native-web' },
    jsx: 'automatic',
    jsxImportSource: 'nativewind',
    loader: {
      // RN ecosystem ships JSX/Flow-free JSX in plain .js — parse it as jsx.
      '.js': 'jsx',
      '.svg': 'dataurl', '.png': 'dataurl', '.jpg': 'dataurl', '.jpeg': 'dataurl',
      '.gif': 'dataurl', '.woff': 'dataurl', '.woff2': 'dataurl', '.ttf': 'dataurl', '.otf': 'dataurl',
      // Audio assets referenced by mock-data/components — not needed for a render.
      '.mp3': 'empty', '.wav': 'empty', '.m4a': 'empty', '.aac': 'empty', '.json': 'json',
    },
    minify: false,
    define: { 'process.env.NODE_ENV': '"development"', __DEV__: 'false' },
  };
}

export async function bundleToIife({ entry, globalName, nodePaths, out, tsconfig }) {
  process.env.DS_RN_RESOLVE_DIR = nodePaths ? dirname(nodePaths) : process.cwd();
  const bundleJs = join(out, '_ds_bundle.js');
  const bundleCss = join(out, '_ds_bundle.css');
  const shared = sharedBuildOptions({ nodePaths, tsconfig });
  let buildResult;
  try {
    buildResult = await build({
      ...shared,
      entryPoints: [entry],
      format: 'iife',
      globalName,
      // RN code reads process.env.EXPO_PUBLIC_* (only NODE_ENV is define-replaced);
      // give the browser a process.env so those reads don't throw at eval.
      banner: { js: "var process=globalThis.process||(globalThis.process={env:{NODE_ENV:'development'}});" },
      footer: { js: `window.${globalName}=${globalName}.__dsMainNs?Object.assign({},${globalName},${globalName}.__dsMainNs,{__dsMainNs:undefined}):${globalName};` },
      outfile: bundleJs,
      logLevel: 'warning',
      define: { ...shared.define, ...IIFE_IMPORT_META_DEFINE },
    });
  } catch (e) {
    const unresolved = [...new Set((e.errors ?? []).map((er) => er.text.match(/Could not resolve "([^"]+)"/)?.[1]).filter(Boolean))];
    if (unresolved.length) console.error(`[UNRESOLVED_IMPORT] ${unresolved.join(', ')} — missing from node_modules or needs a shim in .design-sync/overrides/bundle.mjs`);
    throw e;
  }
  const REACT_PKGS = new Set(['react', 'react-dom', 'react-is']);
  const inlinedExternals = [
    ...new Set(
      Object.keys(buildResult?.metafile?.inputs ?? {})
        .map((p) => p.match(/(?:^|\/)node_modules\/((?:@[^/]+\/)?[^/]+)\//)?.[1])
        .filter((pkg) => pkg && !REACT_PKGS.has(pkg)),
    ),
  ].sort();
  console.error(`  bundle: ${(statSync(bundleJs).size / 1024).toFixed(0)} KB`);
  console.error(`  inlined npm packages: ${inlinedExternals.length}`);
  return { bundleJs, bundleCss, inlinedExternals };
}

export async function bundleExportEvidence({ entry, nodePaths, tsconfig }) {
  process.env.DS_RN_RESOLVE_DIR = nodePaths ? dirname(nodePaths) : process.cwd();
  try {
    const r = await build({
      ...sharedBuildOptions({ nodePaths, tsconfig }),
      entryPoints: [entry],
      format: 'esm',
      write: false,
      outfile: '__ds_export_evidence.mjs',
      logLevel: 'silent',
    });
    const out = Object.values(r.metafile?.outputs ?? {})[0];
    const exports = new Set((out?.exports ?? []).filter((n) => n !== '__dsMainNs'));
    const cjsPresent = Object.entries(r.metafile?.inputs ?? {}).some(
      ([k, i]) => i.format === 'cjs' && !k.startsWith('shim:'),
    );
    return { exports, cjsPresent };
  } catch {
    return null;
  }
}
