"use client";

import { useState, useEffect } from "react";
import { Network, Users, ArrowRight, Loader2, Trophy, ArrowRightCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReferralNode {
  _id: string;
  name: string;
  email: string;
  level: number;
  totalSpent: number;
  createdAt: string;
  referredById: string;
}

interface ReferralRoot {
  _id: string;
  name: string;
  email: string;
  totalSpent: number;
  referralCode: string;
  createdAt: string;
  networkSize: number;
  referralNetwork: ReferralNode[];
}

export default function ReferralsTreePage() {
  const [roots, setRoots] = useState<ReferralRoot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await fetch("/api/admin/referrals/tree");
        const json = await res.json();
        if (json.success) {
          setRoots(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch referral tree", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, []);

  const renderNetworkNodes = (nodes: ReferralNode[], parentId: string, currentLevel: number) => {
    const children = nodes.filter(n => n.referredById === parentId);
    if (children.length === 0) return null;

    return (
      <div className="pl-8 border-l-2 border-muted/50 mt-4 space-y-4 relative">
        {children.map(child => (
          <div key={child._id} className="relative">
            <div className="absolute -left-[34px] top-4 w-8 border-t-2 border-muted/50"></div>
            <Card className="bg-muted/10 border-muted">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">{child.name || "Unknown User"}</span>
                    <Badge variant="outline" className="text-[10px]">Level {currentLevel + 1}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{child.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">KES {(child.totalSpent || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">LTV</p>
                </div>
              </CardContent>
            </Card>
            {renderNetworkNodes(nodes, child._id, currentLevel + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary flex items-center">
            <Network className="mr-3 h-8 w-8 text-accent" />
            Viral Network Leaderboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Track multi-tier customer acquisition loops using MongoDB GraphLookup.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-accent" />
          <p className="text-muted-foreground font-bold animate-pulse">Running Aggregations...</p>
        </div>
      ) : roots.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="py-24 text-center">
            <Users className="h-12 w-12 text-muted-foreground opacity-20 mx-auto mb-4" />
            <h3 className="text-xl font-bold">No Referral Networks Found</h3>
            <p className="text-muted-foreground">When users refer others, their network tree will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8">
          {roots.map((root, index) => (
            <Card key={root._id} className="overflow-hidden shadow-sm border-2">
              <CardHeader className="bg-primary/5 pb-4 border-b">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground h-12 w-12 rounded-xl flex items-center justify-center font-black text-xl shadow-md">
                      #{index + 1}
                    </div>
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {root.name || "Unknown"} 
                        {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                      </CardTitle>
                      <CardDescription>Code: <span className="font-mono font-bold text-primary">{root.referralCode}</span></CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-accent">{root.networkSize}</div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Network Size</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-widest flex items-center">
                    <ArrowRightCircle className="mr-2 h-4 w-4" />
                    Acquisition Tree
                  </h4>
                </div>
                {/* Render the recursive tree starting from the root */}
                <div className="bg-white rounded-lg p-4 border border-muted/50">
                   <div className="flex items-center justify-between bg-primary text-primary-foreground p-4 rounded-lg shadow-sm">
                      <div>
                        <p className="font-bold">{root.name} (Root Advocate)</p>
                        <p className="text-xs opacity-80">{root.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black">KES {(root.totalSpent || 0).toLocaleString()}</p>
                        <p className="text-[10px] uppercase opacity-80 font-bold">Direct Spend</p>
                      </div>
                   </div>
                   
                   {/* Children */}
                   {renderNetworkNodes(root.referralNetwork, root._id, 0)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
