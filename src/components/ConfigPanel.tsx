import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CRITERIA } from "@/lib/data";
import { useStore } from "@/lib/store";

export function ConfigPanel() {
  const { config, setConfig, configOpen, setConfigOpen } = useStore();

  return (
    <Sheet open={configOpen} onOpenChange={setConfigOpen}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Configuration</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="rules" className="mt-4 px-4 pb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="weights">Weights</TabsTrigger>
            <TabsTrigger value="thresholds">Bands</TabsTrigger>
            <TabsTrigger value="scope">Scope</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="mt-4 space-y-4">
            <Field label="Target volume (GWh/yr)">
              <Input
                type="number"
                value={config.rules.targetVolume}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    rules: { ...config.rules, targetVolume: +e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Fit threshold — high">
              <Input
                type="number"
                value={config.rules.fitHigh}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    rules: { ...config.rules, fitHigh: +e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Fit threshold — mid">
              <Input
                type="number"
                value={config.rules.fitMid}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    rules: { ...config.rules, fitMid: +e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Return gate — min margin (€)">
              <Input
                type="number"
                value={config.rules.returnGate}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    rules: { ...config.rules, returnGate: +e.target.value },
                  })
                }
              />
            </Field>
          </TabsContent>

          <TabsContent value="weights" className="mt-4 space-y-5">
            {CRITERIA.map((c) => (
              <div key={c.key}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-foreground">{c.label}</span>
                  <span className="font-medium text-muted-foreground">
                    {config.weights[c.key]}
                  </span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[config.weights[c.key]]}
                  onValueChange={([v]) =>
                    setConfig({
                      ...config,
                      weights: { ...config.weights, [c.key]: v },
                    })
                  }
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="thresholds" className="mt-4 space-y-4">
            <Field label="Green band ≥">
              <Input
                type="number"
                value={config.thresholds.green}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    thresholds: { ...config.thresholds, green: +e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Amber band ≥">
              <Input
                type="number"
                value={config.thresholds.amber}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    thresholds: { ...config.thresholds, amber: +e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Reject below">
              <Input
                type="number"
                value={config.thresholds.reject}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    thresholds: { ...config.thresholds, reject: +e.target.value },
                  })
                }
              />
            </Field>
          </TabsContent>

          <TabsContent value="scope" className="mt-4 space-y-4">
            <Field label="Commodity">
              <Input
                value={config.scope.commodity}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    scope: { ...config.scope, commodity: e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Region">
              <Input
                value={config.scope.region}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    scope: { ...config.scope, region: e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Hub">
              <Input
                value={config.scope.hub}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    scope: { ...config.scope, hub: e.target.value },
                  })
                }
              />
            </Field>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-foreground">{label}</Label>
      {children}
    </div>
  );
}
