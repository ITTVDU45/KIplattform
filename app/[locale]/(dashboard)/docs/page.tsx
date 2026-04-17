"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, Copy, Check, ExternalLink, BookOpen, Code, FileText, History } from "lucide-react";
import { toast } from "sonner";

const endpoints = [
  {
    method: "POST",
    path: "/api/v1/chat/completions",
    description: "Generiert eine Chat-Antwort basierend auf der Konversation",
    params: ["messages", "model", "temperature", "max_tokens"],
  },
  {
    method: "POST",
    path: "/api/v1/embeddings",
    description: "Erstellt Embedding-Vektoren für Text",
    params: ["input", "model"],
  },
  {
    method: "POST",
    path: "/api/v1/images/generate",
    description: "Generiert Bilder aus Textbeschreibungen",
    params: ["prompt", "size", "n", "quality"],
  },
  {
    method: "POST",
    path: "/api/v1/audio/transcribe",
    description: "Transkribiert Audio zu Text",
    params: ["file", "model", "language"],
  },
  {
    method: "GET",
    path: "/api/v1/models",
    description: "Listet alle verfügbaren Modelle",
    params: [],
  },
];

const codeExamples = {
  curl: `curl -X POST "https://api.curser.io/v1/chat/completions" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`,
  python: `import requests

response = requests.post(
    "https://api.curser.io/v1/chat/completions",
    headers={
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
    },
    json={
        "model": "gpt-4",
        "messages": [
            {"role": "user", "content": "Hello!"}
        ]
    }
)
print(response.json())`,
  javascript: `const response = await fetch(
  "https://api.curser.io/v1/chat/completions",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer YOUR_API_KEY",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "user", content: "Hello!" }
      ]
    })
  }
);
const data = await response.json();
console.log(data);`,
};

const changelog = [
  {
    version: "2.1.0",
    date: "2025-01-15",
    changes: [
      "Neues GPT-4 Turbo Modell hinzugefügt",
      "Verbesserte Rate-Limiting Logik",
      "Neue Batch-API für mehrere Anfragen",
    ],
  },
  {
    version: "2.0.0",
    date: "2024-12-01",
    changes: [
      "Breaking: Neue Authentifizierung mit Bearer Token",
      "Neue Embedding-API v2",
      "Verbesserte Fehlerbehandlung",
    ],
  },
  {
    version: "1.5.0",
    date: "2024-10-15",
    changes: [
      "Whisper API für Audiotranskription",
      "DALL-E 3 Integration",
      "Webhook-Unterstützung",
    ],
  },
];

export default function DocsPage() {
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  function copyCode(code: string, type: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(type);
    toast.success("Code kopiert");
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function getMethodColor(method: string) {
    const colors: Record<string, string> = {
      GET: "bg-blue-500",
      POST: "bg-green-500",
      PUT: "bg-yellow-500",
      DELETE: "bg-red-500",
    };
    return colors[method] || "bg-gray-500";
  }

  const filteredEndpoints = endpoints.filter(
    (e) =>
      e.path.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageShell title="Dokumentation" description="API-Referenz und Guides">
      <Tabs defaultValue="intro">
        <TabsList>
          <TabsTrigger value="intro" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Einführung
          </TabsTrigger>
          <TabsTrigger value="reference" className="gap-2">
            <Code className="h-4 w-4" />
            API-Referenz
          </TabsTrigger>
          <TabsTrigger value="examples" className="gap-2">
            <FileText className="h-4 w-4" />
            Beispiele
          </TabsTrigger>
          <TabsTrigger value="changelog" className="gap-2">
            <History className="h-4 w-4" />
            Changelog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="intro" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Willkommen zur Curser API</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Die Curser API bietet Zugang zu leistungsstarken KI-Modellen für
                Textgenerierung, Bildgenerierung, Spracherkennung und mehr.
              </p>
              <h3>Schnellstart</h3>
              <ol>
                <li>Erstellen Sie einen API-Key in der API-Key-Verwaltung</li>
                <li>Fügen Sie den Key als Bearer Token in Ihre Anfragen ein</li>
                <li>Senden Sie Ihre erste Anfrage an die API</li>
              </ol>
              <h3>Basis-URL</h3>
              <pre className="bg-muted p-3 rounded">
                https://api.curser.io/v1
              </pre>
              <h3>Authentifizierung</h3>
              <p>
                Alle API-Anfragen müssen einen Authorization-Header mit Ihrem
                API-Key enthalten:
              </p>
              <pre className="bg-muted p-3 rounded">
                Authorization: Bearer YOUR_API_KEY
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rate Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="font-medium">Starter</div>
                  <div className="text-2xl font-bold mt-1">60</div>
                  <div className="text-sm text-muted-foreground">
                    Requests/Minute
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-medium">Business</div>
                  <div className="text-2xl font-bold mt-1">300</div>
                  <div className="text-sm text-muted-foreground">
                    Requests/Minute
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-medium">Enterprise</div>
                  <div className="text-2xl font-bold mt-1">1000</div>
                  <div className="text-sm text-muted-foreground">
                    Requests/Minute
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reference" className="mt-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Endpunkte durchsuchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Accordion type="single" collapsible className="w-full">
            {filteredEndpoints.map((endpoint, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Badge className={`${getMethodColor(endpoint.method)} text-white`}>
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm">{endpoint.path}</code>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <p className="text-muted-foreground">{endpoint.description}</p>
                    {endpoint.params.length > 0 && (
                      <div>
                        <div className="font-medium mb-2">Parameter</div>
                        <div className="flex flex-wrap gap-2">
                          {endpoint.params.map((param) => (
                            <Badge key={param} variant="outline">
                              {param}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <a href="#">
                        Vollständige Dokumentation
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </a>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        <TabsContent value="examples" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Code-Beispiele</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="curl">
                <TabsList>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                </TabsList>
                {Object.entries(codeExamples).map(([lang, code]) => (
                  <TabsContent key={lang} value={lang} className="mt-4">
                    <div className="relative">
                      <ScrollArea className="h-64">
                        <pre className="bg-muted p-4 rounded-lg text-sm">
                          {code}
                        </pre>
                      </ScrollArea>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyCode(code, lang)}
                      >
                        {copiedCode === lang ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changelog" className="mt-6 space-y-4">
          {changelog.map((release) => (
            <Card key={release.version}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">v{release.version}</CardTitle>
                  <Badge variant="outline">{release.date}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {release.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
