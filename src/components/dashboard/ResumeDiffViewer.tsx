import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus, RefreshCw, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ResumeDiffViewerProps {
  addLines: { content: string; impact: string; reason: string }[];
  removeLines: { content: string; reason: string }[];
  rewriteLines: { before: string; after: string; reason: string }[];
}

export function ResumeDiffViewer({ addLines, removeLines, rewriteLines }: ResumeDiffViewerProps) {
  return (
    <div className="space-y-8">
      {/* Rewrites */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b border-gray-50">
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-indigo-500" />
            Strategic Rewrites
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {rewriteLines.map((line, idx) => (
              <div key={idx} className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                    <Minus className="w-3 h-3" /> Before
                  </div>
                  <p className="text-sm text-gray-500 line-through bg-red-50/50 p-3 rounded-lg border border-red-100/50">
                    {line.before}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase">
                    <Plus className="w-3 h-3" /> After (Optimized)
                  </div>
                  <p className="text-sm text-gray-900 font-medium bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    {line.after}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 w-fit px-2 py-1 rounded">
                  <Info className="w-3 h-3" />
                  {line.reason}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Additions */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-700">
              <Plus className="w-4 h-4" /> Lines to Add
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {addLines.map((line, idx) => (
              <div key={idx} className="p-3 bg-white border border-emerald-100 rounded-lg shadow-sm">
                <p className="text-sm text-gray-900 font-medium mb-2">{line.content}</p>
                <div className="flex flex-col gap-1">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px] w-fit">
                    Impact: {line.impact}
                  </Badge>
                  <p className="text-[10px] text-emerald-600 font-medium">Reason: {line.reason}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Removals */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-red-50/50 border-b border-red-100">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <Minus className="w-4 h-4" /> Lines to Remove
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {removeLines.map((line, idx) => (
              <div key={idx} className="p-3 bg-white border border-red-100 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 line-through mb-2">{line.content}</p>
                <p className="text-[10px] text-red-600 font-medium">Reason: {line.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
