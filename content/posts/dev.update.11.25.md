---
title: "Dev-Update | November 2025"
date: "2025-11-09"
tags: ["discord", "docker", "hosting", "dev update"]
---
A quick progress update from the past few months: I have been setting up a small self-hosting environment, learning Docker and Kubernetes, building a few small tools, and helping a friend with QA. Below are the highlights with inline links to the projects mentioned.

<!-- excerpt -->

## What I’ve been doing
- I set up a personal server and migrated several services off my laptop to reduce downtime. It currently runs [TaskerBot](https://github.com/rsomonte/taskerbot) and a personal instance of Ente (still ironing out the setup).
- I am learning Docker and using Docker Compose to keep deployments reproducible. Kubernetes is on the roadmap and I am experimenting with it for future scaling.
- Published a Firefox add-on to block domains per workspace. It is available on Firefox Browser Add-ons at [Container Website Blocker](https://addons.mozilla.org/addon/container-website-blocker/) and the source code is at [GitHub](https://github.com/rsomonte/container-blocker).
- I have also worked on a simple CLI tool that helps the user get keyphrases that will surface low view-count videos. This was something I did more for fun than for need, because I started watching KVN AUST's YouTube "recycle bin" series and I wondered how it would be if there was an automated tool to get the keyphrases. I also did it to get familiarized with Groovy, because I was told that I was going to deal with it at work. The tool ships with a Java executable (.jar) and the repo is at [DigTube](https://github.com/rsomonte/DigTube).
- Performed QA for [Registrap](https://www.linkedin.com/company/registrap/), a no-code platform by [Julian Castro](https://www.linkedin.com/in/jcasttrop/) that unifies tracking across domains such as fitness, finances, health, habits, and more using custom structures and AI-assisted analysis. 

## Server
I bought an Optiplex and moved services to the dedicated machine. Docker Compose handles deployments and keeps the setup repeatable. I hit some startup issues with Ente (the "quick start" script required manual tweaks) but the instance is now mostly stable.

## Tooling and development
- Docker / Compose: primary tooling for development and deployments.
- Kubernetes: learning and evaluating for future deployments.
- Firefox extension: published and maintained on AMO, source on GitHub.
- DigTube: CLI with .jar, focused on keyphrase generation to help find low-view videos.

## QA
Helped with testing workflows and edge cases to improve user experience, intuitivity, and UI feedback for Registrap.

## Next steps
- Learn Android development.
- Continue learning Kubernetes.
- Buy more storage for the server and add more services to it.

Thanks for reading. If you want configs or notes from any of these projects, ping me and I will share them.
