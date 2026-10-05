// Registro de proveedores de IA (Fase 22). Todos hablan el protocolo compatible con
// OpenAI (`POST {baseUrl}/chat/completions`), asi que se llaman por HTTP sin SDK. El
// asistente prueba los proveedores configurados en orden y usa el primero que responde;
// si uno falla, cae al siguiente. Solo el servidor lee las keys; nunca llegan al cliente.
//
// Solo se incluyen proveedores gratuitos. Los modelos por defecto son ids VIGENTES
// (los free se renuevan seguido: si uno deja de existir, se cambia el id o el override).

export interface AiProviderConfig {
  id: string;
  // Nombre visible para el usuario (se muestra en el chat).
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
}

interface ProviderDefinition {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  keyEnv: string;
  modelEnv: string;
  baseUrlEnv: string;
  // Candado anti-cobro. Si se define, el modelo debe terminar con ese sufijo; si no
  // cumple, el proveedor se ignora por completo (nunca se paga). Lo usa OpenRouter.
  freeModelSuffix?: string;
}

// Orden por defecto de intento. Se puede reordenar con AI_PROVIDER_ORDER.
export const AI_PROVIDERS_REGISTRY: readonly ProviderDefinition[] = [
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'openai/gpt-oss-120b',
    keyEnv: 'AI_GROQ_API_KEY',
    modelEnv: 'AI_GROQ_MODEL',
    baseUrlEnv: 'AI_GROQ_BASE_URL',
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    model: 'nvidia/nemotron-3-super-120b-a12b',
    keyEnv: 'AI_NVIDIA_API_KEY',
    modelEnv: 'AI_NVIDIA_MODEL',
    baseUrlEnv: 'AI_NVIDIA_BASE_URL',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    keyEnv: 'AI_OPENROUTER_API_KEY',
    modelEnv: 'AI_OPENROUTER_MODEL',
    baseUrlEnv: 'AI_OPENROUTER_BASE_URL',
    // OpenRouter cobra si el modelo no es gratuito: solo se usa con sufijo `:free`.
    freeModelSuffix: ':free',
  },
];

export const DEFAULT_AI_DAILY_CAP = 200;

const PLACEHOLDER_KEYS = new Set(['change-me', 'changeme', 'your-key-here', 'tu-key-aqui', '']);

function readValue(envName: string): string | null {
  const raw = process.env[envName]?.trim() ?? '';
  if (raw === '' || PLACEHOLDER_KEYS.has(raw.toLowerCase())) {
    return null;
  }
  return raw;
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

// Devuelve los proveedores con key real configurada, en el orden de intento. Incluye un
// proveedor "propio" si esta la variable heredada AI_API_KEY. Vacio significa que no hay
// IA configurada y el asistente degrada con un aviso.
export function getAiProviders(): AiProviderConfig[] {
  const providers: AiProviderConfig[] = [];

  for (const definition of AI_PROVIDERS_REGISTRY) {
    const apiKey = readValue(definition.keyEnv);
    if (apiKey === null) {
      continue;
    }
    const model = process.env[definition.modelEnv]?.trim() || definition.model;

    // Candado anti-cobro: el proveedor se ignora si el modelo no es de los gratuitos.
    if (definition.freeModelSuffix !== undefined && !model.endsWith(definition.freeModelSuffix)) {
      continue;
    }

    providers.push({
      id: definition.id,
      name: definition.name,
      baseUrl: trimSlash(process.env[definition.baseUrlEnv]?.trim() || definition.baseUrl),
      model,
      apiKey,
    });
  }

  // Proveedor personalizado (compatibilidad con la configuracion anterior de un solo
  // proveedor). Se usa solo si hay AI_API_KEY.
  const customKey = readValue('AI_API_KEY');
  if (customKey !== null) {
    providers.push({
      id: 'custom',
      name: process.env.AI_PROVIDER_NAME?.trim() || 'Proveedor propio',
      baseUrl: trimSlash(process.env.AI_BASE_URL?.trim() || 'https://api.openai.com/v1'),
      model: process.env.AI_MODEL?.trim() || 'gpt-4o-mini',
      apiKey: customKey,
    });
  }

  // Orden opcional: los ids listados van primero, en ese orden; el resto mantiene su
  // orden de registro. Los ids desconocidos se ignoran.
  const order = (process.env.AI_PROVIDER_ORDER ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value !== '');
  if (order.length > 0) {
    providers.sort((a, b) => {
      const indexA = order.indexOf(a.id);
      const indexB = order.indexOf(b.id);
      const rankA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
      const rankB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
      return rankA - rankB;
    });
  }

  return providers;
}

// Tope diario de peticiones con IA POR PROVEEDOR (ademas del rate limit por IP). Asi el
// total diario es la suma de los topes de cada proveedor configurado (por ejemplo 4
// proveedores x 200 = 800). Protege el costo sin desperdiciar la cuota gratis de cada uno.
export function getAiDailyCap(): number {
  const raw = Number.parseInt(process.env.AI_DAILY_REQUEST_CAP?.trim() ?? '', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_AI_DAILY_CAP;
}
