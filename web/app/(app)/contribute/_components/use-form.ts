// Re-export the shared form reducer so the contribute flows keep their local
// import path while all Studio editors share one implementation.
export { useForm } from "@/lib/use-form";
