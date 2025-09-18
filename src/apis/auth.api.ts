import type { AxiosError } from 'axios';
import httpClient from '../clients/http.client';
import type { SignInProps, VerifyTokenProps } from './types';

export const signIn = async (payload: SignInProps) => {
  try {
    const response = await httpClient.post('/auth/signIn', payload);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || 'AxiosError  :Something went wrong';
  }
};

const authApi = {
  signIn
};
export default authApi;
