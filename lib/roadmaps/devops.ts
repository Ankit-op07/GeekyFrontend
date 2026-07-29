// lib/roadmaps/devops.ts
//
// DevOps engineering roadmap. Slugs in `topics` are real Topics in
// `devops-engineering-kit`.

import type { Roadmap } from './types';

export const devopsRoadmap: Roadmap = {
    id: 'devops',
    kitSlug: 'devops-engineering-kit',
    title: 'DevOps Engineering Roadmap',
    tagline: 'Linux to Kubernetes to on-call — a path you can actually finish.',
    audience: 'Developers moving into DevOps/SRE, and DevOps engineers preparing for interviews.',
    weeks: 14,
    accent: { from: 'from-sky-500', to: 'to-indigo-600' },
    stages: [
        {
            id: 'foundations',
            title: 'What DevOps Actually Is',
            goal: 'Answer the culture question without reciting a definition.',
            nodes: [
                {
                    id: 'devops-culture',
                    title: 'Culture & the problem it solves',
                    summary:
                        'DevOps is an answer to a handoff problem, not a job title or a tool list. Interviews open here and candidates who go straight to "Jenkins" lose the point.',
                    tier: 'beginner',
                    est: '2h',
                    topics: ['what-is-devops'],
                    external: [{ title: 'The Twelve-Factor App', url: 'https://12factor.net/' }],
                    interview: [
                        'What problem was DevOps invented to solve?',
                        'Is DevOps a role or a practice? Defend your answer.',
                    ],
                },
                {
                    id: 'lifecycle',
                    title: 'The lifecycle & CI/CD',
                    summary:
                        'Plan → code → build → test → release → deploy → operate → monitor, and the precise difference between continuous delivery and continuous deployment.',
                    tier: 'beginner',
                    est: '3h',
                    topics: ['devops-lifecycle-cicd'],
                    interview: [
                        'Continuous delivery vs continuous deployment — one word of difference, what is it?',
                        'What belongs in CI and what belongs in CD?',
                    ],
                },
                {
                    id: 'roles',
                    title: 'DevOps vs SRE vs Platform Engineering',
                    summary:
                        'Three overlapping job descriptions. Knowing which one the company you are interviewing at actually means is worth real money.',
                    tier: 'beginner',
                    est: '2h',
                    topics: ['devops-vs-sre-vs-platform'],
                    interview: ['How does an SRE role differ from a DevOps role in practice?'],
                },
                {
                    id: 'dora',
                    title: 'DORA metrics',
                    summary:
                        'Deployment frequency, lead time, change failure rate, MTTR. The four numbers that turn "we do DevOps" into something measurable.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['dora-metrics'],
                    interview: [
                        'Name the four DORA metrics.',
                        'A team deploys 20 times a day with a 40% failure rate. Are they doing well?',
                    ],
                },
            ],
        },
        {
            id: 'linux',
            title: 'Linux & Networking',
            goal: 'Be effective on a box with nothing but a shell.',
            nodes: [
                {
                    id: 'linux-basics',
                    title: 'Linux fundamentals',
                    summary:
                        'Filesystem layout, permissions, users, processes, package managers. Everything else in this roadmap runs on it.',
                    tier: 'beginner',
                    est: '6h',
                    topics: ['linux-fundamentals'],
                    interview: [
                        'What does `chmod 644` mean, bit by bit?',
                        'Disk is full. Find what is eating it.',
                        'Difference between a hard link and a symlink.',
                    ],
                    build: 'Spin up a cheap VM and do everything by SSH for a week. There is no substitute.',
                },
                {
                    id: 'linux-net',
                    title: 'Networking on Linux',
                    summary:
                        'Interfaces, routes, ports, DNS resolution and the tools to inspect all four when something cannot reach something else.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['linux-networking'],
                    interview: [
                        'A service cannot reach its database. Walk me through your diagnosis in order.',
                        'What does `ss -tulpn` tell you?',
                    ],
                },
                {
                    id: 'bash',
                    title: 'Bash scripting',
                    summary:
                        'Enough to automate a task and read someone else\'s script. Loops, conditionals, exit codes, and `set -euo pipefail`.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['bash-scripting'],
                    interview: [
                        'What does `set -e` do and where does it surprise you?',
                        'Write a script that rotates logs older than 7 days and exits non-zero on failure.',
                    ],
                },
                {
                    id: 'systemd',
                    title: 'Processes, systemd, cron & logs',
                    summary:
                        'How a service starts, stays up and gets logged on a real machine — the layer containers abstract away and interviews still ask about.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['systemd-cron-logs'],
                    interview: [
                        'Your service dies every night at 3am. Where do you look?',
                        'How do you make a process start on boot and restart on failure?',
                    ],
                },
                {
                    id: 'http-dns-tls',
                    title: 'HTTP, DNS & TLS',
                    summary:
                        'The three protocols behind almost every outage. The TLS handshake and DNS record types are near-guaranteed questions.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['http-dns-tls'],
                    external: [
                        {
                            title: 'HTTP overview — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview',
                        },
                    ],
                    interview: [
                        'Walk through a TLS handshake.',
                        'A vs CNAME vs ALIAS — when do you need each?',
                        'What is the difference between 502 and 504 from a load balancer?',
                    ],
                },
                {
                    id: 'lb-proxies',
                    title: 'Load balancing & reverse proxies',
                    summary:
                        'L4 vs L7, algorithms, health checks, sticky sessions. The vocabulary for every architecture diagram you will draw.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['load-balancing-proxies'],
                    interview: [
                        'L4 vs L7 load balancing — what can L7 do that L4 cannot?',
                        'Why are sticky sessions a smell?',
                    ],
                },
                {
                    id: 'ssh-secrets',
                    title: 'SSH, firewalls & secrets',
                    summary:
                        'Key-based auth, port hygiene, and the rule that a secret in git is a secret that has leaked.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['ssh-ports-secrets'],
                    interview: [
                        'How does SSH key authentication work?',
                        'A password was committed to git and then removed in the next commit. Is it safe?',
                    ],
                },
            ],
        },
        {
            id: 'git',
            title: 'Git & GitOps',
            goal: 'Recover from any git mess and explain why git is the deployment trigger.',
            nodes: [
                {
                    id: 'git-internals',
                    title: 'Git internals & workflows',
                    summary:
                        'Commits as a DAG of snapshots. Once you see that, rebase, cherry-pick and reflog stop being incantations.',
                    tier: 'beginner',
                    est: '4h',
                    topics: ['git-internals-workflows'],
                    external: [
                        { title: 'Pro Git (free book)', url: 'https://git-scm.com/book/en/v2' },
                    ],
                    interview: [
                        'merge vs rebase — when do you use each, and what is the golden rule of rebase?',
                        'You committed to main by mistake and pushed. Fix it.',
                        'What is the reflog and when has it saved you?',
                    ],
                },
                {
                    id: 'branching',
                    title: 'Branching strategies',
                    summary:
                        'GitFlow vs trunk-based, and why high-performing teams overwhelmingly pick the second one.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['branching-strategies'],
                    interview: [
                        'Why does trunk-based development correlate with better DORA numbers?',
                        'How do you ship an unfinished feature on trunk?',
                    ],
                },
                {
                    id: 'gitops',
                    title: 'GitOps: git as the source of truth',
                    summary:
                        'Declare desired state in a repo, let a controller reconcile reality to it. The model behind ArgoCD and Flux.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['gitops-source-of-truth'],
                    interview: [
                        'What does GitOps give you that a `kubectl apply` in a CI job does not?',
                        'How do you handle secrets in a GitOps repo?',
                    ],
                },
            ],
        },
        {
            id: 'containers',
            title: 'Containers',
            goal: 'Build a small, safe image and explain what a container really is.',
            nodes: [
                {
                    id: 'containers-vs-vms',
                    title: 'Containers vs VMs',
                    summary:
                        'Namespaces and cgroups, not magic. "A container is a process with a restricted view of the system" is the answer that lands.',
                    tier: 'beginner',
                    est: '3h',
                    topics: ['containers-vs-vms'],
                    interview: [
                        'What Linux kernel features make a container a container?',
                        'Is a container a lightweight VM? Explain why that framing is wrong.',
                    ],
                },
                {
                    id: 'docker-images',
                    title: 'Images, layers & Dockerfiles',
                    summary:
                        'Layer caching and multi-stage builds — the two things that decide whether your image is 80 MB or 1.8 GB.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['docker-images-dockerfile'],
                    external: [
                        {
                            title: 'Dockerfile best practices',
                            url: 'https://docs.docker.com/build/building/best-practices/',
                        },
                    ],
                    interview: [
                        'Why does COPY package.json before COPY . matter?',
                        'What is a multi-stage build and what does it save?',
                        'ENTRYPOINT vs CMD.',
                    ],
                    build: 'Take any app you have and get its image under 150 MB with a multi-stage build and a non-root user.',
                },
                {
                    id: 'docker-net',
                    title: 'Networking, volumes & Compose',
                    summary:
                        'How containers talk to each other and keep data. Compose is still the fastest way to stand up a local stack.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['docker-networking-volumes-compose'],
                    interview: [
                        'How does one container reach another by name?',
                        'Bind mount vs named volume — which for a database, and why?',
                    ],
                },
                {
                    id: 'registries',
                    title: 'Registries & image security',
                    summary:
                        'Tags are mutable, digests are not. Scanning, minimal base images and why `:latest` in production is a red flag.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['registries-image-security'],
                    interview: [
                        'Why is deploying `myapp:latest` dangerous?',
                        'How do you reduce the attack surface of an image?',
                    ],
                },
            ],
        },
        {
            id: 'kubernetes',
            title: 'Kubernetes',
            goal: 'Debug a pod that will not start without reaching for a tutorial.',
            nodes: [
                {
                    id: 'k8s-architecture',
                    title: 'Architecture',
                    summary:
                        'API server, etcd, scheduler, controller manager, kubelet — and the reconciliation loop that ties them together. Everything else follows from that loop.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['kubernetes-architecture'],
                    external: [
                        {
                            title: 'Kubernetes concepts',
                            url: 'https://kubernetes.io/docs/concepts/',
                        },
                    ],
                    interview: [
                        'What happens, component by component, when you run `kubectl apply -f deployment.yaml`?',
                        'What is the control loop and why is Kubernetes described as declarative?',
                    ],
                },
                {
                    id: 'workloads',
                    title: 'Pods, Deployments & Services',
                    summary:
                        'The objects you touch daily, and the difference between the four Service types.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['pods-deployments-services'],
                    interview: [
                        'Deployment vs StatefulSet vs DaemonSet — one sentence each.',
                        'ClusterIP, NodePort, LoadBalancer, ExternalName — when do you use which?',
                        'A pod is CrashLoopBackOff. Walk me through your debugging.',
                    ],
                },
                {
                    id: 'config-secrets',
                    title: 'ConfigMaps & Secrets',
                    summary:
                        'Configuration out of the image — and the uncomfortable truth that a Kubernetes Secret is base64, not encryption, unless you turn on encryption at rest.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['config-secrets'],
                    interview: [
                        'Are Kubernetes Secrets encrypted by default?',
                        'How does a config change reach a running pod?',
                    ],
                },
                {
                    id: 'ingress',
                    title: 'Ingress & service discovery',
                    summary:
                        'How outside traffic gets in and how services find each other. Cluster DNS is the part people forget to mention.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['ingress-networking'],
                    interview: [
                        'Ingress vs Service of type LoadBalancer — why would you use both?',
                        'How does service discovery work inside the cluster?',
                    ],
                },
                {
                    id: 'scaling-probes',
                    title: 'Probes, resources & autoscaling',
                    summary:
                        'Requests vs limits, liveness vs readiness, HPA. Getting liveness and readiness backwards is a real outage and a real interview question.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['scaling-probes-resources'],
                    interview: [
                        'Liveness vs readiness probe — what happens when each fails?',
                        'What is the difference between a resource request and a limit, and what is QoS class?',
                        'What does the OOMKilled status tell you?',
                    ],
                },
                {
                    id: 'helm',
                    title: 'Helm & operators',
                    summary:
                        'Templating and packaging, then the operator pattern for software that needs domain logic to run itself.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['helm-operators'],
                    interview: [
                        'What problem does Helm solve that plain YAML does not?',
                        'What is an operator and when is one justified?',
                    ],
                },
            ],
        },
        {
            id: 'cicd',
            title: 'CI/CD & Infrastructure as Code',
            goal: 'Design a pipeline and describe the rollout strategy at the end of it.',
            nodes: [
                {
                    id: 'pipeline-design',
                    title: 'Pipeline design',
                    summary:
                        'Stages, gates, artifacts, and the principle that you build once and promote the same artifact through environments.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['pipeline-design'],
                    interview: [
                        'Design a pipeline for a microservice from commit to production.',
                        'Why must you not rebuild the artifact per environment?',
                    ],
                },
                {
                    id: 'gh-actions',
                    title: 'GitHub Actions',
                    summary:
                        'The CI most teams actually use now: workflows, jobs, matrices, caching, and OIDC instead of long-lived cloud keys.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['github-actions'],
                    external: [
                        { title: 'GitHub Actions docs', url: 'https://docs.github.com/en/actions' },
                    ],
                    interview: [
                        'How do you deploy to AWS from Actions without storing an access key?',
                        'How do you speed up a slow workflow?',
                    ],
                    build: 'Write a workflow that lints, tests, builds an image, and pushes it — with a cache that actually hits.',
                },
                {
                    id: 'jenkins',
                    title: 'Jenkins & GitLab CI',
                    summary:
                        'Still everywhere in enterprises. Know declarative pipelines and shared libraries well enough to maintain one.',
                    tier: 'intermediate',
                    kind: 'optional',
                    est: '3h',
                    topics: ['jenkins-gitlab-ci'],
                    interview: ['What is a Jenkinsfile, and what does an agent block control?'],
                },
                {
                    id: 'deploy-strategies',
                    title: 'Rolling, blue-green & canary',
                    summary:
                        'How you get new code to users without an outage — and how you get it back off them quickly when it is bad.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['deployment-strategies'],
                    interview: [
                        'Blue-green vs canary — cost, risk and rollback speed for each.',
                        'How do you deploy a change that needs a database migration?',
                    ],
                },
                {
                    id: 'iac',
                    title: 'Infrastructure as Code',
                    summary:
                        'Declarative infrastructure, state files, drift and idempotency. The concepts survive whichever tool the company uses.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['iac-concepts'],
                    interview: [
                        'What is configuration drift and how does IaC detect it?',
                        'Imperative vs declarative — which is Terraform and which is Ansible?',
                    ],
                },
                {
                    id: 'terraform',
                    title: 'Terraform',
                    summary:
                        'Providers, state, modules, plan/apply. The state file — where it lives, who locks it — is the question that separates users from operators.',
                    tier: 'advanced',
                    est: '5h',
                    topics: ['terraform-deep-dive'],
                    external: [
                        {
                            title: 'Terraform docs',
                            url: 'https://developer.hashicorp.com/terraform/docs',
                        },
                    ],
                    interview: [
                        'Why must Terraform state be remote and locked on a team?',
                        'Someone changed a resource in the console. What does the next plan do?',
                        'terraform import — when do you need it?',
                    ],
                },
                {
                    id: 'ansible',
                    title: 'Ansible & configuration management',
                    summary:
                        'Agentless, push-based, idempotent. Complements Terraform rather than competing with it — say that and you have answered the comparison.',
                    tier: 'intermediate',
                    kind: 'optional',
                    est: '3h',
                    topics: ['ansible-config-management'],
                    interview: ['Terraform or Ansible for installing packages on an existing fleet? Why?'],
                },
            ],
        },
        {
            id: 'cloud',
            title: 'Cloud',
            goal: 'Design and price a small production environment.',
            nodes: [
                {
                    id: 'cloud-fundamentals',
                    title: 'Fundamentals & shared responsibility',
                    summary:
                        'IaaS/PaaS/SaaS, regions and availability zones, and the shared responsibility model — a compliance-flavoured question that comes up more than you expect.',
                    tier: 'beginner',
                    est: '3h',
                    topics: ['cloud-fundamentals'],
                    interview: [
                        'Region vs availability zone, and why does multi-AZ matter?',
                        'In the shared responsibility model, who patches the OS on EC2? On Lambda?',
                    ],
                },
                {
                    id: 'compute-storage',
                    title: 'Compute, storage & networking',
                    summary:
                        'EC2, S3, VPC — subnets, route tables, security groups vs NACLs. VPC design is the most common cloud whiteboard question.',
                    tier: 'intermediate',
                    est: '5h',
                    topics: ['compute-storage-networking'],
                    interview: [
                        'Design a VPC for a public web tier and a private database tier.',
                        'Security group vs NACL — stateful or stateless?',
                        'How does a private subnet reach the internet?',
                    ],
                },
                {
                    id: 'iam-cost',
                    title: 'IAM, security & cost',
                    summary:
                        'Least privilege, roles over keys, and the FinOps instinct interviewers like: knowing what a design costs per month.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['iam-security-cost'],
                    interview: [
                        'Role vs user vs policy. How does an EC2 instance get credentials without any being stored on it?',
                        'The bill doubled last month. How do you find out why?',
                    ],
                },
                {
                    id: 'serverless',
                    title: 'Serverless & managed services',
                    summary:
                        'Lambda, queues, managed databases — and the cold starts, timeouts and vendor coupling you trade for them.',
                    tier: 'intermediate',
                    kind: 'optional',
                    est: '3h',
                    topics: ['serverless-managed-services'],
                    interview: [
                        'When is serverless the wrong choice?',
                        'What is a cold start and how do you mitigate one?',
                    ],
                },
            ],
        },
        {
            id: 'observability',
            title: 'Observability & Reliability',
            goal: 'Answer "is it broken, and why" with data.',
            nodes: [
                {
                    id: 'three-pillars',
                    title: 'Metrics, logs & traces',
                    summary:
                        'What each is for, and the distinction interviewers probe: monitoring tells you something is wrong, observability lets you ask why without shipping new code.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['three-pillars'],
                    interview: [
                        'Monitoring vs observability.',
                        'You have a slow request across five services. Which pillar finds it?',
                    ],
                },
                {
                    id: 'prometheus',
                    title: 'Prometheus & Grafana',
                    summary:
                        'Pull-based metrics, the four metric types, PromQL and dashboards. The de facto stack, so expect specifics.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['prometheus-grafana'],
                    external: [
                        {
                            title: 'Prometheus — Overview',
                            url: 'https://prometheus.io/docs/introduction/overview/',
                        },
                    ],
                    interview: [
                        'Counter vs gauge vs histogram — give an example of each.',
                        'Why is a histogram better than an average for latency?',
                        'Why is Prometheus pull-based?',
                    ],
                },
                {
                    id: 'logging-elk',
                    title: 'Centralised logging',
                    summary:
                        'Shipping, indexing and searching logs — plus structured logging and retention, which is where the cost conversation happens.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['logging-elk'],
                    interview: ['Why structured logs? What do you put in every line?'],
                },
                {
                    id: 'slo',
                    title: 'SLIs, SLOs, error budgets & alerting',
                    summary:
                        'The framework that makes reliability a decision rather than an argument. Alert on symptoms, not causes.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['slis-slos-alerting', 'sre-principles-error-budgets'],
                    external: [
                        { title: 'Google SRE Book (free)', url: 'https://sre.google/sre-book/table-of-contents/' },
                    ],
                    interview: [
                        'SLI vs SLO vs SLA.',
                        'What do you do when the error budget is exhausted?',
                        'Why should you not alert on CPU?',
                    ],
                },
                {
                    id: 'incidents',
                    title: 'Incident management & on-call',
                    summary:
                        'Severity, incident command, blameless postmortems. The behavioural half of an SRE loop lives here.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['incident-management-oncall'],
                    interview: [
                        'Walk me through an incident you handled, start to finish.',
                        'Why blameless postmortems? What goes wrong without them?',
                    ],
                },
                {
                    id: 'ha-dr',
                    title: 'HA, disaster recovery & chaos',
                    summary:
                        'RTO, RPO and the uncomfortable question of whether your backups actually restore.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['ha-dr-chaos'],
                    interview: [
                        'RTO vs RPO — set both for a payments system and justify them.',
                        'High availability vs disaster recovery — not the same thing. Explain.',
                    ],
                },
            ],
        },
        {
            id: 'security-delivery',
            title: 'DevSecOps & Progressive Delivery',
            goal: 'Put security in the pipeline instead of at the end of it.',
            nodes: [
                {
                    id: 'shift-left',
                    title: 'Shift-left & the DevSecOps pipeline',
                    summary:
                        'SAST, DAST, SCA and where each belongs in a pipeline that developers will not route around.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['shift-left-devsecops'],
                    external: [{ title: 'OWASP Top Ten', url: 'https://owasp.org/www-project-top-ten/' }],
                    interview: [
                        'Where do SAST and DAST each fit, and what does each miss?',
                        'Do you fail the build on a critical CVE? Argue it both ways.',
                    ],
                },
                {
                    id: 'secrets-mgmt',
                    title: 'Secrets management & scanning',
                    summary:
                        'Vault, dynamic credentials, rotation, and pre-commit scanning so the secret never lands in history.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['secrets-scanning'],
                    interview: [
                        'How do you rotate a database password with zero downtime?',
                        'What is a dynamic secret and why is it better than a rotated static one?',
                    ],
                },
                {
                    id: 'supply-chain',
                    title: 'Container & supply-chain security',
                    summary:
                        'SBOMs, image signing, provenance. A newer topic that signals you are current when it comes up.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['container-supply-chain-security'],
                    interview: [
                        'What is an SBOM and what does it let you do the day a CVE drops?',
                        'How do you prove an image was built by your pipeline?',
                    ],
                },
                {
                    id: 'argocd',
                    title: 'ArgoCD, Flux & progressive delivery',
                    summary:
                        'Pull-based deployment, drift correction, and automated canaries with metric-driven rollback.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['argocd-flux', 'progressive-delivery-rollbacks'],
                    external: [
                        { title: 'Argo CD docs', url: 'https://argo-cd.readthedocs.io/en/stable/' },
                    ],
                    interview: [
                        'Push-based CD vs pull-based GitOps — what changes about cluster credentials?',
                        'How does an automated canary decide to roll back?',
                    ],
                },
            ],
        },
        {
            id: 'interview',
            title: 'Interview Prep',
            goal: 'Handle the troubleshooting and design rounds.',
            nodes: [
                {
                    id: 'top-questions',
                    title: 'Top DevOps interview questions',
                    summary:
                        'A breadth pass across the whole subject. Use it to find gaps after the stages above, not instead of them.',
                    tier: 'intermediate',
                    kind: 'practice',
                    est: '5h',
                    topics: ['top-devops-interview-questions', 'quick-revision-cheatsheets'],
                },
                {
                    id: 'troubleshooting',
                    title: 'Troubleshooting scenarios',
                    summary:
                        'The round DevOps interviews are actually won in. "The site is down" — what do you check, in what order, and what do you say while you check it.',
                    tier: 'advanced',
                    kind: 'practice',
                    est: '5h',
                    topics: ['troubleshooting-scenarios'],
                    interview: [
                        'The website is down. Go.',
                        'Pods are stuck in Pending. What are the four likeliest causes?',
                        'Deploys succeed but the new version never serves traffic. Where do you look?',
                    ],
                    build: 'Deliberately break your own cluster — bad image tag, missing secret, resource limit too low — and practise diagnosing each from the symptom.',
                },
                {
                    id: 'devops-design',
                    title: 'System design for DevOps',
                    summary:
                        'Design the platform, not the product: CI/CD for 50 services, multi-region, zero-downtime migrations.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['devops-system-design'],
                    interview: [
                        'Design a deployment platform for 50 microservices and 200 engineers.',
                        'Design multi-region failover for a stateful service.',
                    ],
                },
                {
                    id: 'behavioral-devops',
                    title: 'Behavioural, resume & career',
                    summary:
                        'Incident stories, on-call trade-offs and how to write a DevOps resume that survives the screen.',
                    tier: 'beginner',
                    est: '2h',
                    topics: ['behavioral-resume-roadmap'],
                    interview: [
                        'Tell me about the worst outage you were part of.',
                        'Tell me about a time you pushed back on a deadline for reliability reasons.',
                    ],
                },
            ],
        },
    ],
};
