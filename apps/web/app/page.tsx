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

export default function Home() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<number | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(false);

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
        setLoadingIssues(false);
      });
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">CodeSentinel AI Dashboard</h1>

      <div className="flex gap-8">
        <div className="w-1/3">
          <h2 className="text-xl font-semibold mb-4">Reviews</h2>
          <div className="space-y-2">
            {loadingReviews ? (
              <p className="text-gray-500">Loading reviews...</p>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  onClick={() => handleSelectReview(review.id)}
                  className={`p-3 rounded cursor-pointer border ${
                    selectedReview === review.id
                      ? "border-blue-500 bg-gray-800"
                      : "border-gray-700 bg-gray-900"
                  }`}
                >
                  <p className="font-medium">{review.filename}</p>
                  <p className="text-sm text-gray-400">
                    {review.owner}/{review.repo} #{review.pull_number}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(review.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="w-2/3">
          <h2 className="text-xl font-semibold mb-4">Issues</h2>
          {loadingIssues ? (
            <p className="text-gray-500">Loading issues...</p>
          ) : selectedReview === null ? (
            <p className="text-gray-500">Select a review to see issues.</p>
          ) : issues.length === 0 ? (
            <p className="text-gray-500">No issues found for this file.</p>
          ) : (
            <div className="space-y-3">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-4 rounded border border-gray-700 bg-gray-900"
                >
                  <div className="flex gap-2 mb-2">
                    <span
                      className={`text-xs px-2 py-1 rounded font-bold ${
                        issue.severity === "high"
                          ? "bg-red-600"
                          : issue.severity === "medium"
                          ? "bg-yellow-600"
                          : "bg-blue-600"
                      }`}
                    >
                      {issue.severity.toUpperCase()}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-gray-700">
                      {issue.category}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-gray-700">
                      Line {issue.line}
                    </span>
                  </div>
                  <p className="text-sm">{issue.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}