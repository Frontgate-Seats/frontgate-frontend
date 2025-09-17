// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import type { ReactNodeProps } from "../shared/types/node.type";
// // import type { AuthContextType } from "../contexts/types.context";

// export const AuthProvider: React.FC<ReactNodeProps> = ({ children }) => {
// //   const { loginWithRedirect, user: oauthUser } = useAuth0();

//   const navigate = useNavigate();
//   const { VerifyToken } = useAuthStore();

//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [user, setUser] = useState<User | object>({});

//   const authToken = localStorage.getItem("authToken");
//   const SignIn = async () => {
//     // Perform authentication logic here
//     loginWithRedirect();
//     setIsAuthenticated(true);
//   };

//   const SignOut = () => {
//     // Perform logout logic here
//     setIsAuthenticated(false);
//   };

//   const SignUp = () => {
//     // Perform logout logic here
//     setIsAuthenticated(false);
//   };

//   const verifyAuthenticationToken = async () => {
//     try {
//       const response = await VerifyToken();
//       console.log("response : ", response);
//     } catch (err) {
//       console.log(err);
//       navigate("/auth/SignIn");
//     }
//   };

//   // Value object to be provided to consumers
//   const authContextValue: AuthContextType = {
//     isAuthenticated,
//     user,
//     SignIn,
//     SignOut,
//     SignUp,
//   };

//   useEffect(() => {
//     // if (!authToken) {
//     //   navigate('/auth/SignIn');
//     // }
//     // if (authToken) {
//     //     verifyAuthenticationToken()
//     // }
//     // if (oauthUser) {
//     //   console.log(oauthUser);
//     //   navigate('/');
//     // }
//   }, [authToken, setIsAuthenticated, oauthUser]);

//   return (
//     <AuthContext.Provider value={authContextValue}>
//       {children}
//     </AuthContext.Provider>
//   );
// };
