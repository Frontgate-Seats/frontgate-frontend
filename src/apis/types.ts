export type SignInProps = {
  email?: FormDataEntryValue;
  password: FormDataEntryValue;
};

export type VerifyTokenProps = {
    token: string;
}