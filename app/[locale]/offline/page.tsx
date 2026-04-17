"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OfflinePage() {
  const t = useTranslations("offline");

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          {/* Offline Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <WifiOff className="h-10 w-10 text-muted-foreground" />
          </div>
          
          {/* Title & Description */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {t("title")}
            </h1>
            <p className="text-muted-foreground">
              {t("description")}
            </p>
          </div>
          
          {/* Retry Button */}
          <Button 
            onClick={handleRetry}
            size="lg"
            className="min-h-[48px] min-w-[160px]"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("retry")}
          </Button>
          
          {/* Cached Content Hint */}
          <p className="text-xs text-muted-foreground">
            {t("cached")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
