type GlobalAuthFailureHandler = () => void | Promise<void>;

let globalAuthFailureHandler: GlobalAuthFailureHandler | null = null;

export function setGlobalAuthFailureHandler(handler: GlobalAuthFailureHandler | null): () => void {
  globalAuthFailureHandler = handler;

  return () => {
    if (globalAuthFailureHandler === handler) {
      globalAuthFailureHandler = null;
    }
  };
}

export async function notifyGlobalAuthFailure(): Promise<void> {
  await globalAuthFailureHandler?.();
}
