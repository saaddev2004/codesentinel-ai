"use client";

import { useEffect, useState } from "react";

type Review = {
  id: number;
  owner: string;
  repo: string;
  pull_number: number;
  filename: string;
  created_at: string;
};

type Issue = {
  id: number;
  line: number;
  severity: string;
  category: string;
  message: string;
};

// GitHub dark-mode label colors (bg tint + text + border), matching GitHub's issue/label pill style
const severityStyles: Record<string, string> = {
  high: "bg-[#da3633]/15 text-[#f85149] border-[#f85149]/40",
  medium: "bg-[#9e6a03]/15 text-[#d29922] border-[#d29922]/40",
  low: "bg-[#1f6feb]/15 text-[#58a6ff] border-[#58a6ff]/40",
};

const severityDot: Record<string, string> = {
  high: "bg-[#f85149]",
  medium: "bg-[#d29922]",
  low: "bg-[#58a6ff]",
};

export default function Home() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<number | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [issuesCache, setIssuesCache] = useState<Record<number, Issue[]>>({});

  useEffect(() => {
    setLoadingReviews(true);
    fetch("http://127.0.0.1:8000/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        setReviews(data);
        setLoadingReviews(false);
      });
  }, []);

  const handleSelectReview = (reviewId: number) => {
    setSelectedReview(reviewId);
    setLoadingIssues(true);
    fetch(`http://127.0.0.1:8000/api/reviews/${reviewId}/issues`)
      .then((res) => res.json())
      .then((data) => {
        setIssues(data);
        setIssuesCache((prev) => ({ ...prev, [reviewId]: data }));
        setLoadingIssues(false);
      });
  };

  const allKnownIssues = Object.values(issuesCache).flat();
  const stats = {
    totalReviews: reviews.length,
    high: allKnownIssues.filter((i) => i.severity === "high").length,
    medium: allKnownIssues.filter((i) => i.severity === "medium").length,
    low: allKnownIssues.filter((i) => i.severity === "low").length,
  };

  return (
    <main className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Helvetica,Arial,sans-serif]">
      {/* GitHub-style top nav */}
      <header className="border-b border-[#21262d] bg-[#010409]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" className="w-7 h-7 shrink-0" fill="none" stroke="#f0f6fc" strokeWidth={2} strokeLinecap="round">
              <path d="M4 9V6a2 2 0 0 1 2-2h3" />
              <path d="M20 9V6a2 2 0 0 0-2-2h-3" />
              <path d="M4 15v3a2 2 0 0 0 2 2h3" />
              <path d="M20 15v3a2 2 0 0 1-2 2h-3" />
              <circle cx="12" cy="12" r="2.4" fill="#f0f6fc" stroke="none" />
            </svg>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-[#c9d1d9] text-base">codesentinel-ai</span>
              <span className="text-[#8b949e] text-sm">/ dashboard</span>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#238636]/15 text-[#3fb950] border border-[#238636]/40 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" /> Live
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stat cards styled like GitHub repo insight boxes */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="Reviews" value={stats.totalReviews} color="#58a6ff" />
          <StatCard label="High severity" value={stats.high} color="#f85149" />
          <StatCard label="Medium severity" value={stats.medium} color="#d29922" />
          <StatCard label="Low severity" value={stats.low} color="#3fb950" />
        </div>

        <div className="flex gap-5">
          {/* Reviews sidebar - GitHub "Files changed" style list */}
          <div className="w-[300px] shrink-0">
            <div className="border border-[#30363d] rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-[#161b22] border-b border-[#30363d] text-xs font-semibold text-[#8b949e] uppercase tracking-wide">
                Reviews
              </div>
              <div className="divide-y divide-[#21262d]">
                {loadingReviews ? (
                  <SkeletonList />
                ) : reviews.length === 0 ? (
                  <EmptyState text="No reviews yet." />
                ) : (
                  reviews.map((review) => (
                    <button
                      key={review.id}
                      onClick={() => handleSelectReview(review.id)}
                      className={`w-full text-left px-3 py-2.5 transition-colors duration-100 ${
                        selectedReview === review.id
                          ? "bg-[#1f6feb]/10 border-l-2 border-l-[#1f6feb]"
                          : "hover:bg-[#161b22] border-l-2 border-l-transparent"
                      }`}
                    >
                      <p className="font-mono text-sm text-[#58a6ff] truncate">{review.filename}</p>
                      <p className="text-xs text-[#8b949e] mt-0.5">
                        {review.owner}/{review.repo}{" "}
                        <span className="text-[#8b949e]">#{review.pull_number}</span>
                      </p>
                      <p className="text-[11px] text-[#6e7681] mt-1">
                        {new Date(review.created_at).toLocaleString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Issues panel - styled like a GitHub PR conversation / checks list */}
          <div className="flex-1 min-w-0">
            <div className="border border-[#30363d] rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-[#161b22] border-b border-[#30363d] text-xs font-semibold text-[#8b949e] uppercase tracking-wide">
                Issues
              </div>
              <div className="p-4 min-h-[380px]">
                {loadingIssues ? (
                  <SkeletonList rows={3} />
                ) : selectedReview === null ? (
                  <EmptyState text="Select a review from the left to see flagged issues." />
                ) : issues.length === 0 ? (
                  <EmptyState text="No issues found — this file looks clean." success />
                ) : (
                  <div className="space-y-2.5">
                    {issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="p-3.5 rounded-md border border-[#30363d] bg-[#0d1117] hover:border-[#8b949e]/40 transition-colors duration-100"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${severityDot[issue.severity] ?? "bg-[#8b949e]"}`}
                          />
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                              severityStyles[issue.severity] ?? "bg-[#8b949e]/15 text-[#8b949e] border-[#8b949e]/40"
                            }`}
                          >
                            {issue.severity}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                            {issue.category}
                          </span>
                          <span className="text-[11px] font-mono text-[#6e7681] ml-auto">
                            Line {issue.line}
                          </span>
                        </div>
                        <p className="text-sm text-[#c9d1d9] leading-relaxed">{issue.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-md border border-[#30363d] bg-[#161b22] p-4">
      <p className="text-2xl font-semibold" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-[#8b949e] mt-1">{label}</p>
    </div>
  );
}

function EmptyState({ text, success }: { text: string; success?: boolean }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px] text-center">
      <p className={`text-sm ${success ? "text-[#3fb950]" : "text-[#8b949e]"}`}>{text}</p>
    </div>
  );
}

function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="p-2 space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 rounded-md bg-[#161b22] animate-pulse" />
      ))}
    </div>
  );
}