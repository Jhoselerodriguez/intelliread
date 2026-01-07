import { useState } from "react";
import { X, Check, Loader2, ExternalLink, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { APIKeys } from "@/types";
import { testAPIConnection } from "@/lib/apiClient";

interface APISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: APIKeys | undefined;
  onSave: (keys: APIKeys) => void;
}

interface ProviderConfig {
  id: keyof Omit<APIKeys, "id">;
  name: string;
  recommended?: boolean;
  optional?: boolean;
  placeholder: string;
  features: string[];
  link: string;
  linkText: string;
  model: string;
  testProvider: "groq" | "perplexity" | "anthropic" | "gemini";
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "groqApiKey",
    name: "Groq API",
    recommended: true,
    placeholder: "gsk-...",
    features: [
      "Free tier available with generous limits",
      "Fast response times",
      "Powers intelligent text chunking",
    ],
    link: "https://console.groq.com",
    linkText: "console.groq.com",
    model: "llama-3.3-70b-versatile",
    testProvider: "groq",
  },
  {
    id: "geminiApiKey",
    name: "Google Gemini API",
    recommended: true,
    placeholder: "AIza...",
    features: [
      "Free tier with generous limits",
      "Multimodal understanding (images + text)",
      "Chart data extraction capabilities",
    ],
    link: "https://aistudio.google.com/app/apikey",
    linkText: "aistudio.google.com/app/apikey",
    model: "gemini-2.5-flash-lite",
    testProvider: "gemini",
  },
  {
    id: "perplexityApiKey",
    name: "Perplexity API",
    optional: true,
    placeholder: "pplx-...",
    features: [
      "Web-enhanced answers with citations",
      "Real-time information retrieval",
    ],
    link: "https://perplexity.ai/settings/api",
    linkText: "perplexity.ai/settings/api",
    model: "sonar-pro",
    testProvider: "perplexity",
  },
  {
    id: "anthropicApiKey",
    name: "Anthropic Claude API",
    optional: true,
    placeholder: "sk-ant-...",
    features: ["Advanced reasoning capabilities", "Detailed document analysis"],
    link: "https://console.anthropic.com",
    linkText: "console.anthropic.com",
    model: "claude-sonnet-4-20250514",
    testProvider: "anthropic",
  },
];

export const APISettingsModal = ({
  isOpen,
  onClose,
  apiKeys,
  onSave,
}: APISettingsModalProps) => {
  const [keys, setKeys] = useState<APIKeys>({
    groqApiKey: apiKeys?.groqApiKey || "",
    perplexityApiKey: apiKeys?.perplexityApiKey || "",
    anthropicApiKey: apiKeys?.anthropicApiKey || "",
    geminiApiKey: apiKeys?.geminiApiKey || "",
  });

  const [testResults, setTestResults] = useState<
    Record<string, { loading: boolean; success?: boolean; error?: string }>
  >({});

  const handleChange = (id: keyof APIKeys, value: string) => {
    setKeys((prev) => ({ ...prev, [id]: value }));
    setTestResults((prev) => ({ ...prev, [id]: { loading: false } }));
  };

  const handleTest = async (provider: ProviderConfig) => {
    const apiKey = keys[provider.id];
    if (!apiKey) return;

    setTestResults((prev) => ({
      ...prev,
      [provider.id]: { loading: true },
    }));

    const result = await testAPIConnection(provider.testProvider, apiKey);

    setTestResults((prev) => ({
      ...prev,
      [provider.id]: {
        loading: false,
        success: result.success,
        error: result.error,
      },
    }));
  };

  const handleSave = () => {
    onSave(keys);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">API Configuration</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Configure your AI API keys to enable intelligent Q&A and image
            analysis features. Keys are stored securely in your browser's local
            storage.
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {PROVIDERS.map((provider) => (
            <ProviderSection
              key={provider.id}
              provider={provider}
              value={keys[provider.id] || ""}
              onChange={(value) => handleChange(provider.id, value)}
              onTest={() => handleTest(provider)}
              testResult={testResults[provider.id]}
            />
          ))}
        </div>

        {/* Privacy Note */}
        <div className="mt-6 p-4 bg-primary/5 rounded-lg flex gap-3">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Privacy Note:</span>{" "}
            All keys are stored locally in your browser and never sent anywhere
            except directly to the respective API providers when you use the Q&A
            feature.
          </p>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full mt-4">
          Save API Keys
        </Button>
      </DialogContent>
    </Dialog>
  );
};

interface ProviderSectionProps {
  provider: ProviderConfig;
  value: string;
  onChange: (value: string) => void;
  onTest: () => void;
  testResult?: { loading: boolean; success?: boolean; error?: string };
}

const ProviderSection = ({
  provider,
  value,
  onChange,
  onTest,
  testResult,
}: ProviderSectionProps) => {
  return (
    <div className="p-4 border border-border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-foreground">
          {provider.name}
          {provider.recommended && (
            <span className="ml-2 text-xs text-primary font-normal">
              (Recommended)
            </span>
          )}
          {provider.optional && (
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              (Optional)
            </span>
          )}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={!value || testResult?.loading}
        >
          {testResult?.loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Test Connection"
          )}
        </Button>
      </div>

      <Input
        type="password"
        placeholder={provider.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mb-3"
      />

      {/* Test Result */}
      {testResult && !testResult.loading && (
        <div
          className={`mb-3 text-sm flex items-center gap-2 ${
            testResult.success ? "text-success" : "text-destructive"
          }`}
        >
          {testResult.success ? (
            <>
              <Check className="w-4 h-4" />
              Connection Successful
            </>
          ) : (
            <>
              <X className="w-4 h-4" />
              Connection Failed: {testResult.error}
            </>
          )}
        </div>
      )}

      {/* Features */}
      <div className="space-y-1 mb-2">
        {provider.features.map((feature, idx) => (
          <p key={idx} className="text-sm text-success flex items-center gap-1">
            <Check className="w-3 h-3" />
            {feature}
          </p>
        ))}
      </div>

      {/* Link */}
      <p className="text-sm text-muted-foreground">
        Get your key at:{" "}
        <a
          href={provider.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {provider.linkText}
        </a>
      </p>

      {/* Model */}
      <p className="text-xs text-muted-foreground mt-1">
        <span className="font-medium">Model:</span> {provider.model}
      </p>
    </div>
  );
};
