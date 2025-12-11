import { RefreshCw, Clock, Package, Snowflake, Thermometer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StorageInfo, ReuseInfo as ReuseInfoType } from "@/components/dashboard/types/recipe";

interface ReuseInfoProps {
  reuseInfo?: ReuseInfoType;
  storageInfo?: StorageInfo;
  isBatchCooking?: boolean;
  isReuse?: boolean;
  compact?: boolean;
}

const storageMethodIcons = {
  fridge: Snowflake,
  freezer: Snowflake,
  room_temp: Thermometer
};

const storageMethodLabels = {
  fridge: 'Réfrigérateur',
  freezer: 'Congélateur',
  room_temp: 'Température ambiante'
};

export const ReuseInfoDisplay = ({ 
  reuseInfo, 
  storageInfo, 
  isBatchCooking,
  isReuse,
  compact = false 
}: ReuseInfoProps) => {
  if (!reuseInfo && !storageInfo && !isBatchCooking) return null;

  const StorageIcon = storageInfo ? storageMethodIcons[storageInfo.method] : Snowflake;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {reuseInfo && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs gap-1">
                  <RefreshCw className="h-3 w-3" />
                  {reuseInfo.total_uses}x
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Peut servir {reuseInfo.total_uses} fois</p>
                {reuseInfo.reuse_tips && <p className="text-xs text-muted-foreground">{reuseInfo.reuse_tips}</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {storageInfo && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs gap-1">
                  <StorageIcon className="h-3 w-3" />
                  {storageInfo.duration_days}j
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Conservation: {storageInfo.duration_days} jours au {storageMethodLabels[storageInfo.method].toLowerCase()}</p>
                {storageInfo.tips && <p className="text-xs text-muted-foreground">{storageInfo.tips}</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {isBatchCooking && (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs gap-1">
            <Package className="h-3 w-3" />
            Batch
          </Badge>
        )}

        {isReuse && (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs gap-1">
            <RefreshCw className="h-3 w-3" />
            Réutilisation
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Clock className="h-4 w-4 text-primary" />
        Mode Parent Pressé
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {reuseInfo && (
          <div className="flex items-start gap-2">
            <RefreshCw className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Réutilisation</p>
              <p className="text-muted-foreground text-xs">
                {reuseInfo.total_uses} utilisations possibles
              </p>
              {reuseInfo.best_days && reuseInfo.best_days.length > 0 && (
                <p className="text-muted-foreground text-xs">
                  Meilleurs jours: {reuseInfo.best_days.join(', ')}
                </p>
              )}
              {reuseInfo.reuse_tips && (
                <p className="text-muted-foreground text-xs mt-1">{reuseInfo.reuse_tips}</p>
              )}
            </div>
          </div>
        )}

        {storageInfo && (
          <div className="flex items-start gap-2">
            <StorageIcon className="h-4 w-4 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium">Conservation</p>
              <p className="text-muted-foreground text-xs">
                {storageInfo.duration_days} jours au {storageMethodLabels[storageInfo.method].toLowerCase()}
              </p>
              {storageInfo.container && (
                <p className="text-muted-foreground text-xs">
                  Contenant: {storageInfo.container}
                </p>
              )}
              {storageInfo.tips && (
                <p className="text-muted-foreground text-xs mt-1">{storageInfo.tips}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {isBatchCooking && (
        <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1 mt-2">
          <Package className="h-3 w-3" />
          Parfait pour le batch cooking
        </Badge>
      )}
    </div>
  );
};
