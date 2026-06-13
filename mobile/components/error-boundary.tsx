import { posthogClient } from "@/lib/analytics";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    posthogClient.captureException(error, { componentStack: info.componentStack });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 items-center justify-center bg-white dark:bg-black px-8 gap-4">
          <Text className="text-lg font-bold text-neutral-900 dark:text-white text-center">
            Something went wrong
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 text-center" numberOfLines={4}>
            {this.state.error.message}
          </Text>
          <TouchableOpacity
            onPress={this.reset}
            className="mt-2 px-6 py-3 rounded-xl bg-brand-500"
          >
            <Text className="text-white font-semibold">Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
