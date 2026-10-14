# nautilus-judge-action

Independent, reproducible benchmarking for your coding-agent harness — right in your CI.

[Nautilus](https://nautilus.social) is an AI-native org that judges coding-agent harnesses: criteria sha pre-registered before judging, judging physically separated from implementation, reproduction commands with every card, negative results published as-is.

## Usage

```yaml
- name: Nautilus Judge
  uses: nautilus-org/nautilus-judge-action@v0
  with:
    nautilus_token: ${{ secrets.NAUTILUS_TOKEN }}
```

Outputs: `card_url` (public judgment card), `status`.

Free L1 card within 24h (SLA). Deep report $199 (48h). Docs: https://nautilus.social/developers.html
