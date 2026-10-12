export type RecaptchaOptions = {
  sitekey: string;
  theme: "dark";
  size: "compact";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};
export type RecaptchaApi = {
  render: (element: HTMLElement, options: RecaptchaOptions) => number;
  reset: (id: number) => void;
};
declare global {
  interface Window {
    grecaptcha?: RecaptchaApi;
    celenasRecaptchaLoaded?: () => void;
  }
}

let pending: Promise<RecaptchaApi> | undefined;

export function loadRecaptcha(): Promise<RecaptchaApi> {
  if (
    typeof window.grecaptcha?.render === "function" &&
    typeof window.grecaptcha.reset === "function"
  )
    return Promise.resolve(window.grecaptcha);
  if (pending) return pending;
  pending = new Promise<RecaptchaApi>((resolve, reject) => {
    const script = document.createElement("script");
    const finish = (api?: RecaptchaApi) => {
      clearTimeout(timeout);
      delete window.celenasRecaptchaLoaded;
      script.onerror = null;
      if (api) resolve(api);
      else {
        script.remove();
        reject(new Error("Could not load reCAPTCHA"));
      }
    };
    const timeout = setTimeout(() => finish(), 15_000);
    window.celenasRecaptchaLoaded = () => {
      const api = window.grecaptcha;
      finish(
        typeof api?.render === "function" && typeof api.reset === "function"
          ? api
          : undefined,
      );
    };
    script.src =
      "https://www.google.com/recaptcha/api.js?onload=celenasRecaptchaLoaded&render=explicit&hl=ja";
    script.async = true;
    script.defer = true;
    script.onerror = () => finish();
    document.head.append(script);
  }).catch((error: unknown) => {
    pending = undefined;
    throw error;
  });
  return pending;
}
