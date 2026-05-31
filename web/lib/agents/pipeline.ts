/**
 * Multi-agent pipeline pattern using Claude Managed Agents.
 *
 * Pattern: two specialist agents run in sequence — the output of the first
 * becomes the input of the second. The TypeScript code is the orchestrator.
 *
 * Setup (run once, store the returned IDs):
 *   const { researcherId, writerAgentId, envId } = await setupAgents();
 *
 * Per-task (use stored IDs):
 *   const result = await runPipeline(researcherId, writerAgentId, envId, topic);
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── One-time setup ────────────────────────────────────────────────────────

export async function setupAgents() {
  const env = await client.beta.environments.create({
    name: "pipeline-env",
    config: { type: "cloud", networking: { type: "unrestricted" } },
  });

  const researcher = await client.beta.agents.create({
    name: "Researcher",
    model: "claude-opus-4-7",
    system: "You are a concise research assistant. Always end with a bullet list of key findings.",
    tools: [{ type: "agent_toolset_20260401", default_config: { enabled: true } }],
  });

  const writer = await client.beta.agents.create({
    name: "Writer",
    model: "claude-opus-4-7",
    system: "You are a skilled writer. Turn research findings into a short, engaging summary.",
    tools: [{ type: "agent_toolset_20260401", default_config: { enabled: true } }],
  });

  return {
    envId: env.id,
    researcherAgentId: researcher.id,
    researcherAgentVersion: researcher.version,
    writerAgentId: writer.id,
    writerAgentVersion: writer.version,
  };
}

// ─── Per-run pipeline ──────────────────────────────────────────────────────

export async function runPipeline(
  researcherAgentId: string,
  researcherAgentVersion: number,
  writerAgentId: string,
  writerAgentVersion: number,
  envId: string,
  topic: string,
): Promise<{ research: string; summary: string }> {
  const research = await runAgent(
    researcherAgentId,
    researcherAgentVersion,
    envId,
    `Research this topic and list key findings: ${topic}`,
  );

  const summary = await runAgent(
    writerAgentId,
    writerAgentVersion,
    envId,
    `Here are research findings:\n\n${research}\n\nWrite a short engaging summary.`,
  );

  return { research, summary };
}

// ─── Single-agent session helper ──────────────────────────────────────────

async function runAgent(
  agentId: string,
  agentVersion: number,
  envId: string,
  prompt: string,
): Promise<string> {
  const session = await client.beta.sessions.create({
    agent: { type: "agent", id: agentId, version: agentVersion },
    environment_id: envId,
  });

  // Open stream and send message concurrently so no early events are missed
  const [text] = await Promise.all([
    collectText(session.id),
    client.beta.sessions.events.send(session.id, {
      events: [{ type: "user.message", content: [{ type: "text", text: prompt }] }],
    }),
  ]);

  await client.beta.sessions.delete(session.id);
  return text;
}

async function collectText(sessionId: string): Promise<string> {
  const stream = await client.beta.sessions.events.stream(sessionId);
  const chunks: string[] = [];

  for await (const event of stream) {
    if (event.type === "agent.message") {
      for (const block of event.content) {
        if (block.type === "text") chunks.push(block.text);
      }
    } else if (
      event.type === "session.status_idle" ||
      event.type === "session.status_terminated"
    ) {
      break;
    }
  }

  return chunks.join("");
}

// ─── Example usage ────────────────────────────────────────────────────────

async function main() {
  console.log("Setting up agents (one-time)...");
  const {
    envId,
    researcherAgentId,
    researcherAgentVersion,
    writerAgentId,
    writerAgentVersion,
  } = await setupAgents();

  console.log("Running pipeline...");
  const { research, summary } = await runPipeline(
    researcherAgentId,
    researcherAgentVersion,
    writerAgentId,
    writerAgentVersion,
    envId,
    "the impact of short-form video on attention spans",
  );

  console.log("\n── RESEARCH ──────────────────────────");
  console.log(research);
  console.log("\n── SUMMARY ───────────────────────────");
  console.log(summary);
}

main().catch(console.error);
