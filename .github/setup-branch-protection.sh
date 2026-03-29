#!/usr/bin/env bash
# ============================================================
#  BreadBread — GitHub Branch Protection Ruleset Setup
#  Usage: bash .github/setup-branch-protection.sh <owner/repo>
#  Requires: gh CLI authenticated with admin access
# ============================================================

set -euo pipefail

REPO="${1:?Usage: $0 <owner/repo>}"

echo "🔒 Creating branch protection ruleset for $REPO ..."

gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  "/repos/${REPO}/rulesets" \
  -f name="main-protection" \
  -f target="branch" \
  -f enforcement="active" \
  --input - <<'EOF'
{
  "name": "main-protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          {
            "context": "FE: Lint & Type-check",
            "integration_id": null
          },
          {
            "context": "BE: Lint & Type-check",
            "integration_id": null
          },
          {
            "context": "BE: Unit Tests",
            "integration_id": null
          }
        ]
      }
    },
    {
      "type": "deletion"
    },
    {
      "type": "non_fast_forward"
    }
  ],
  "bypass_actors": []
}
EOF

echo "✅ Ruleset created! Verify at: https://github.com/${REPO}/settings/rules"
