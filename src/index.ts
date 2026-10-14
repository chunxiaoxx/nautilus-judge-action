import * as core from '@actions/core'
import { execSync } from 'child_process'

const API = 'https://nautilus.social/api'

async function main() {
  try {
    const token = core.getInput('nautilus_token')
    const repoUrl = core.getInput('repo_url') || process.env.GITHUB_SERVER_URL + '/' + process.env.GITHUB_REPOSITORY
    const benchmark = core.getInput('benchmark')

    // 1. submit intake (真端点 2026-10-13 实测: assay/submissions, 字段 harness/repo_url/lane/contact)
    const res = await fetch(`${API}/platform/org/assay/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        harness: benchmark,
        repo_url: repoUrl,
        lane: 'l1',
        contact: process.env.GITHUB_ACTOR ? process.env.GITHUB_ACTOR + '@users.noreply.github.com' : 'action@nautilus.social',
        source: 'github-action',
      }),
    })
    const data: any = await res.json()
    if (!res.ok) throw new Error(`intake failed: ${res.status} ${JSON.stringify(data).slice(0, 200)}`)
    const sid = data.data?.id || data.id
    const editToken = data.data?.edit_token || data.edit_token
    if (editToken) core.saveState('edit_token', editToken)
    core.info(`intake accepted: id=${sid} status=${data.data?.status || data.status} (l1 SLA 24h)`)

    // 2. poll (max 24h, every 10min; CI timeout safer at 50min)
    core.info('polling judgment status (CI mode: first check only — re-run action to re-poll)')
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 60000))
      const s = await fetch(`${API}/platform/org/assay/submissions/${sid}`, { headers: { Authorization: `Bearer ${token}` } })
      const sd: any = await s.json()
      const st = sd.data?.status || sd.status
      core.info(`status: ${st}`)
      if (st === 'delivered') {
        const card = sd.data?.card_url || `https://nautilus.social/api/judge_status?id=${sid}`
        core.setOutput('card_url', card)
        core.setOutput('status', 'delivered')
        core.summary.addHeading('Nautilus Judge — independent card delivered').addLink(card, card).write()
        return
      }
    }
    core.setOutput('status', 'judging')
    core.info('judging in progress — card will appear on https://nautilus.social/bench; re-run to fetch.')
  } catch (e: any) {
    core.setFailed(e.message)
  }
}
main()
