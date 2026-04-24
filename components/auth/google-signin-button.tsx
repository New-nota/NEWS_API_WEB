import { signIn } from "@/auth";

export function GoogleSignInButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: "/dashboard" });
      }}
    >
      <button className="button button-primary" type="submit">
        Sign in with Google
      </button>
    </form>
  );
}
