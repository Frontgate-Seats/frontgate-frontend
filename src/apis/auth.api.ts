import type { AxiosError } from 'axios';
import httpClient from '../clients/types';
import type { SignInProps, VerifyTokenProps } from './types';

export const SignIn = async (payload: SignInProps) => {
  try {
    const response = await httpClient.post('/auth/signIn', payload);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || 'AxiosError  :Something went wrong';
  }
};

// export const SignUp = async (payload: SignUpProps) => {
//   try {
//     const response = await httpClient.post('/auth/signUp', payload);
//     return response.data;
//   } catch (error) {
//     const axiosError = error as AxiosError;
//     throw axiosError.response?.data || 'AxiosError : Something went wrong ';
//   }
// };

export const VerifyToken = async (payload: VerifyTokenProps) => {
  try {
    const response = await httpClient.post('/auth/verifyToken', payload);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || 'AxiosError : Something went wrong ';
  }
};

const authApi = {
  SignIn,
  // SignUp,
  VerifyToken
};
export default authApi;
