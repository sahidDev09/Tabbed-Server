import Link from "next/link";
import { Button } from "./ui/button";
import React from "react";

interface AuthButtonProps {
  onActionClick?: () => void;
}

export default function AuthButton({ onActionClick }: AuthButtonProps) {
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:justify-end">
      <Button asChild size="sm" variant={"outline"} onClick={onActionClick}>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"} onClick={onActionClick}>
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}

// export default async function AuthButton() {
// const supabase = await createClient();
//
// const {
//   data: { user },
// } = await supabase.auth.getUser();
//
// if (!hasEnvVars) {
//   return (
//     <>
//       <div className="flex gap-4 items-center">
//         <div>
//           <Badge
//             variant={"default"}
//             className="font-normal pointer-events-none"
//           >
//             Please update .env.local file with anon key and url
//           </Badge>
//         </div>
//         <div className="flex gap-2">
//           <Button
//             asChild
//             size="sm"
//             variant={"outline"}
//             disabled
//             className="opacity-75 cursor-none pointer-events-none"
//           >
//             <Link href="/sign-in">Sign in</Link>
//           </Button>
//           <Button
//             asChild
//             size="sm"
//             variant={"default"}
//             disabled
//             className="opacity-75 cursor-none pointer-events-none"
//           >
//             <Link href="/sign-up">Sign up</Link>
//           </Button>
//         </div>
//       </div>
//     </>
//   );
// }
// return user ? (
//   <div className="flex items-center gap-4">
//     Hey, {user.email}!
//     <form action={signOutAction}>
//       <Button type="submit" variant={"outline"}>
//         Sign out
//       </Button>
//     </form>
//   </div>
// ) : (
// <div className="flex gap-2 justify-end">
//     <Button asChild size="sm" variant={"outline"}>
//         <Link href="/sign-in">Sign in</Link>
//     </Button>
//     <Button asChild size="sm" variant={"default"}>
//         <Link href="/sign-up">Sign up</Link>
//     </Button>
// </div>
// );
//}
