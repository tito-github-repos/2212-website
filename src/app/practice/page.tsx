// "use client";

// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { loginWithGoogle } from "@/lib/firebase";

// export default function Home() {
//   const router = useRouter();

//   const handleGoogleLogin = async () => {
//     try {
//       await loginWithGoogle();
//       alert("Login successful");
//       router.push("/maths");
//     } catch (error) {
//       alert("Login failed");
//     }
//   };

//   return (
//     <main className="min-h-screen bg-white flex items-center justify-center px-6">
//       <div className="w-full max-w-md text-center">

//         <div className="flex justify-center mb-8">
//           <div className="w-28 h-28 rounded-full overflow-hidden">
//             <Image
//               src="/images/app_logo.jpeg"
//               alt="TikoKids"
//               width={112}
//               height={112}
//               className="w-full h-full object-cover"
//             />
//           </div>
//         </div>

//         <h1 className="text-4xl font-bold text-green-600">
//           Welcome!
//         </h1>

//         <p className="mt-3 text-lg text-gray-500">
//           Let's start learning together
//         </p>

//         <p className="mt-12 text-base font-semibold text-gray-500">
//           Sign in to continue
//         </p>

//         <button
//           onClick={handleGoogleLogin}
//           className="w-full h-14 mt-8 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center gap-3"
//         >
//           <Image
//             src="/images/download.svg"
//             alt="Google"
//             width={24}
//             height={24}
//           />

//           <span className="text-green-600 font-bold">
//             Continue with Google
//           </span>
//         </button>

//         <button
//           onClick={() => router.push("/maths")}
//           className="mt-6 text-green-600 font-semibold"
//         >
//           Continue as Guest
//         </button>

//         <p className="mt-12 text-xs text-gray-400">
//           By continuing, you agree to our Terms of Service
//           <br />
//           and Privacy Policy
//         </p>

//       </div>
//     </main>
//   );
// // }

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Avatar, Box, Button, Container, Typography } from "@mui/material";
import { loginWithGoogle } from "@/lib/firebase";

export default function PracticeLoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      alert("Login successful");
      router.push("/maths");
    } catch (error) {
      alert("Login failed");
    }
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        bgcolor: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
      }}
    >
      <Container maxWidth="xs" sx={{ textAlign: "center" }}>
        {/* Logo */}
        {/* <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <Avatar sx={{ width: 112, height: 112 }}>
            <Image
              src="/img/practice/app_logo.jpeg"
              alt="TikoKids"
              width={112}
              height={112}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Avatar>
        </Box> */}

        <Typography variant="h4" sx={{ fontWeight: 700, color: "success.main" }}>
          Welcome!
        </Typography>

        <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 400, color: "grey.500" }}>
          Let's start learning together
        </Typography>

        <Typography
          variant="body1"
          sx={{ mt: 6, fontWeight: 600, color: "grey.500" }}
        >
          Sign in to continue
        </Typography>

        {/* Google button */}
        <Button
          fullWidth
          onClick={handleGoogleLogin}
          startIcon={
            <Image
              src="/img/practice/download.svg"
              alt="Google"
              width={24}
              height={24}
            />
          }
          sx={{
            height: 56,
            mt: 4,
            borderRadius: "16px",
            bgcolor: "white",
            border: "1px solid",
            borderColor: "grey.200",
            boxShadow: 1,
            color: "success.main",
            fontWeight: 700,
            textTransform: "none",
            fontSize: "1rem",
            "&:hover": { bgcolor: "grey.50" },
          }}
        >
          Continue with Google
        </Button>

        {/* Guest */}
        <Button
          onClick={() => router.push("/maths")}
          sx={{
            mt: 3,
            color: "success.main",
            fontWeight: 600,
            textTransform: "none",
            fontSize: "1rem",
          }}
        >
          Continue as Guest
        </Button>

        <Typography
          variant="caption"
          component="p"
          sx={{ mt: 6 }}
          color="grey.400"
        >
          By continuing, you agree to our Terms of Service
          <br />
          and Privacy Policy
        </Typography>
      </Container>
    </Box>
  );
}