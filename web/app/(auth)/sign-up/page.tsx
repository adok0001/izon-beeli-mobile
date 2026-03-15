import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <SignUp
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "shadow-xl rounded-2xl border border-neutral-200 dark:border-neutral-800",
        },
      }}
    />
  );
}
