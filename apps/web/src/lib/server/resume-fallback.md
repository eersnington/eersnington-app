# Heyya, this is my resume

### Sreenarayanan Sreekanth

Software Engineer - Dubai, UAE

+971 55 375 1285 · [hi@eers.dev](mailto:hi@eers.dev)

GitHub: [github.com/eersnington](https://github.com/eersnington/)

Website: [eers.dev](https://www.eers.dev/) · Skills: [skill.md](https://www.eers.dev/SKILL.md)

### Summary

Seeking to apply my experience in distributed systems, edge runtimes, and performance optimization to build reliable, low latency infrastructure and developer platforms. Interested in web infrastructure and platform engineering roles where I can improve system performance and developer workflows.

### Work Experience

#### Stockpenguins - Software Engineer (Dubai, AE | Singapore) | 01/2025 - 11/2025

Collaborated with a 5-person team and operated a Django backend powering automated financial data pipelines using Aurora Postgres on AWS.

Designed cron-driven ingestion and cleansing workflows to improve data accuracy and reliability.

Migrated performance-critical services to Cloudflare Workers with Durable Objects, reducing failure rates.

Built a distributed caching layer using Workers KV, reducing frontend latency from ~10s to ~400ms at P99.

Designed and maintained a Next.js full stack platform deployed on Vercel with edge runtime integrations.

Integrated brokerage connectivity systems using SnapTrade and Plaid APIs.

#### Freelance - Software Engineer (Dubai, AE) | 07/2024 - 12/2024

Built production web applications and backend services using Vue, Node, and Express.

Delivered Shopify integrations and internal workflow tools for small business clients.

Owned features end-to-end including architecture, implementation, and deployment.

#### ZaplineAI - Technical Co-founder (India) | 08/2023 - 11/2024

Built an AI-powered voice agent platform for e-commerce stores via Twilio WebSockets + FastAPI.

Integrated Shopify GraphQL API for 24/7 phone-based order management (status, edits, returns).

Fine-tuned BERT for classification and optimized Whisper inference on an Nvidia A10G GPU EC2 for fast response.

Awarded a $5,000 AWS Startup grant to continue model development and inference.

### Education

#### PSG College of Arts and Science - B.Sc. Computer Science (India) | 09/2021 - 06/2024

CGPA 8.8/10. Student Chairperson of the Computer Science Department; organized a state-wide programming hackathon; led technical teams; represented college as team lead at IIT Kharagpur Data Science Hackathon.

#### Indian Institute of Technology Madras - Diploma in Programming and Data Science (India) | 01/2022 - 12/2024

Completed diploma-level curriculum (core courses plus projects) covering programming foundations, data structures and algorithms, databases, and modern application development.

### Skills

Distributed systems · Performance optimization · Edge computing · API design · System reliability · Event-driven architectures · CI/CD pipelines · TypeScript · Node.js · Zig · Go · Rust · React · Next.js · Django · FastAPI · Cloudflare Workers · Durable Objects · Workers KV · AWS · GCP Pub/Sub · PostgreSQL · Docker · Git · WebSockets · REST APIs

### Projects

#### sideffect - [git.new/sideffect](https://git.new/sideffect)

Sideffect is a library and Vite plugin that lets you define Cloudflare Workflows using clean, reusable, schema-backed steps in an EffectTS-inspired syntax. It auto-discovers workflow files, generates native `WorkflowEntrypoint` classes, and injects Wrangler bindings and environment types during development and deployment. Workflows are written with typed `Step.make(...)` activities and composed with `Workflow.make(...).toLayer(...)`.

#### stepdaddy - [git.new/stepdaddy](https://git.new/stepdaddy)

Stepdaddy adds Git-backed idempotency records for external side-effectful calls inside Cloudflare Workflows. On retry it reuses a previously committed provider result for the same key, rejects changed requests, or stops for reconciliation when the outcome is unknown.

#### stateful-ci - [git.new/stateful-ci](https://git.new/stateful-ci)

Jenkins for GitHub Actions: a CI cache system that restores useful workspace state onto fresh GitHub Actions runners while preventing untrusted pull requests from polluting trusted branch state.

#### agent-container - [git.new/agent-container](https://git.new/agent-container)

Local sandboxing for agents with Cloudflare/workerd, replacing raw host access with explicit capability bindings for workspace IO, subprocesses, environment values, and network policy.

#### jj-navi - [git.new/jj-navi](https://git.new/jj-navi)

Worktree management for parallel agent executions that resolves stale Jujutsu workspaces and keeps shell navigation aligned with active work.

#### Vercel Workflow SDK Fastify - [workflow-sdk.dev](https://workflow-sdk.dev/docs/getting-started/fastify)

Collaborated with core engineers on Vercel on API design and implemented Fastify runtime support. Explored Temporal, AWS Step Functions, and saga patterns for retries, idempotency, and safe side effects.

#### workflow-studio - [useworkflow.studio](https://useworkflow.studio/)

Designed and built a remote execution control plane for Workflow applications, including worker runtime, deployment lifecycle tooling, deployment safety guardrails, active deployment pointers, ownership drift detection, and diagnostics.

#### Firecracker MicroVM Deployment & Management CLI Tool

Built a CLI for provisioning and managing Firecracker microVMs on EC2 bare-metal and KVM-capable hosts, handling VM lifecycle, rootfs and kernel configuration, networking, and isolated execution.
