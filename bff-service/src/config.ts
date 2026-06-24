export type BffConfig = {
  port: number;
  allowedRecipients: Set<string>;
};

const DEFAULT_PORT = 3000;

export function getConfig(env: NodeJS.ProcessEnv = process.env): BffConfig {
  const parsedPort = Number(env.PORT);
  const allowedRecipients = new Set(
    (env.ALLOWED_RECIPIENTS || '')
      .split(',')
      .map((recipient) => recipient.trim())
      .filter(Boolean),
  );

  return {
    port: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_PORT,
    allowedRecipients,
  };
}

export function getRecipientUrl(recipientName: string, env: NodeJS.ProcessEnv = process.env): string | undefined {
  const normalizedRecipientName = recipientName.toUpperCase().replace(/[^A-Z0-9]/g, '_');

  return env[`${normalizedRecipientName}_URL`] || env[normalizedRecipientName] || env[recipientName];
}
