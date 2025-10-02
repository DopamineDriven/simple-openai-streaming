"use client";

import type { OpenAiDisplayNameUnion, Provider } from "@simple-stream/types";
import {
  getModelIdByDisplayName,
  getModelsForProvider
} from "@simple-stream/types";
import {
  Button,
  ChevronDown,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@simple-stream/ui";
import React from "react";
import { useModelSelection } from "@/context/model-selection-context";
import { defaultModelByProvider, providerMetadata } from "@/lib/models";
import { cn } from "@/lib/utils";

interface ProviderModelSelectorProps {
  className?: string;
  variant?: "button" | "compact";
}
export function ProviderModelSelector({
  className,
  variant = "button"
}: ProviderModelSelectorProps) {
  const { selectedModel, updateProvider, updateModel, providers, openDrawer } =
    useModelSelection();

  const availableModels = getModelsForProvider(selectedModel.provider);
  const currentMeta = providerMetadata[selectedModel.provider];

  const handleProviderChange = (prov: Provider) => {
    switch (prov) {
      case "openai":
      default: {
        const displayName = defaultModelByProvider.openai;
        updateProvider("openai");
        updateModel(
          displayName,
          getModelIdByDisplayName("openai", displayName)
        );
        break;
      }
    }
  };

  const handleModelChange = (name: string) => {
    const prov = selectedModel.provider;
    switch (prov) {
      case "openai":
      default: {
        const dn = name as OpenAiDisplayNameUnion;
        updateModel(dn, getModelIdByDisplayName("openai", dn));
        break;
      }
    }
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Select
          value={selectedModel.provider}
          onValueChange={v => handleProviderChange(v as Provider)}>
          <SelectTrigger className="bg-brand-component border-brand-border w-[140px]">
            <div className="flex items-center">
              {React.createElement(currentMeta.icon, {
                className: "mr-2 size-4"
              })}
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-brand-component border-brand-border">
            {providers.map(prov => {
              const Icon = providerMetadata[prov].icon;
              return (
                <SelectItem key={prov} value={prov}>
                  <div className="flex items-center">
                    <Icon className="mr-2 size-4" />
                    {providerMetadata[prov].name}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Select
          value={selectedModel.displayName}
          onValueChange={handleModelChange}>
          <SelectTrigger className="bg-brand-component border-brand-border w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-brand-component border-brand-border">
            {availableModels.map(model => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={openDrawer}
      className={cn(
        "text-brand-text hover:bg-brand-component max-w-full min-w-0 px-3 text-sm sm:text-base",
        className
      )}>
      <currentMeta.icon className="mr-2 size-4 flex-shrink-0" />
      <div className="flex min-w-0 flex-1 overflow-x-hidden">
        <span className="max-w-[10ch] truncate sm:max-w-[16ch] lg:max-w-[20ch]">
          {selectedModel.displayName}
        </span>
      </div>
      <ChevronDown className="ml-1 size-4" />
    </Button>
  );
}
