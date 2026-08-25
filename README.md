# DevOps Microservices

A medium-sized e-commerce platform built as 4 microservices + a React frontend. The application code is already written — your job in this course is to handle the **DevOps lifecycle** around it: package it, ship it, run it on AWS, monitor it, and operate it like a real production system.

## What you'll learn

By the end of the course you'll take an application from a developer's laptop to a live, monitored, auto-deploying system on AWS. You will know **what to build, why, and in what order** — the things that separate a beginner from a working DevOps engineer.

We cover the complete DevOps lifecycle:

1. **Local development** — running the app on your machine
2. **Containerization** — packaging services into Docker images
3. **CI** — automated testing on every code change
4. **AWS infrastructure** — VPC, subnets, security groups, IAM, RDS, S3, EC2
5. **Load balancing & auto-scaling** — ALB, Auto Scaling Groups, CloudFront
6. **CD** — automated deployment pipelines
7. **Monitoring & alerting** — CloudWatch dashboards, alarms, log analysis
8. **Operations** — backups, secrets, cost, incident response

After the AWS-console phase, we extend the project into:
- **Terraform** (Infrastructure as Code)
- **Kubernetes / EKS** (container orchestration)

## What the application does

A standard e-commerce flow: users register, browse a product catalog, add to a cart, check out, and receive an email confirmation. Under the hood it's four independent services that talk to each other.

| Service | Owns | Talks to |
|---------|------|----------|
| **auth-service** | users, passwords, JWTs | nothing |
| **product-service** | catalog, categories, inventory | nothing |
| **order-service** | cart, orders | product-service, notification-service |
| **notification-service** | notifications, emails | (consumes events) |
| **frontend** | React SPA | (calls services via nginx/ALB) |

## Tools we'll use

| Layer | Tool |
|-------|------|
| Language | Node.js 20 + JavaScript |
| Backend framework | Express |
| Database | PostgreSQL 15 |
| Frontend | React + Vite + Tailwind CSS |
| Reverse proxy | Nginx |
| Containers | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Cloud | AWS (us-east-1) — VPC, IAM, RDS, S3, EC2, ALB, ASG, CloudFront, SQS, SES, CloudWatch |
| Image registry | Amazon ECR |
| Version control | Git + GitHub |
| Future: IaC | Terraform |
| Future: Orchestration | Kubernetes (EKS) |

## Repository structure

```
DevOps_Microservices/
├── services/
│   ├── auth-service/          # JWT auth, user management
│   ├── product-service/       # Catalog + inventory
│   ├── order-service/         # Cart + checkout
│   └── notification-service/  # Email dispatcher (event-driven)
├── frontend/                  # React SPA
├── nginx/                     # Reverse proxy configs
├── infrastructure/            # AWS guides, scripts, diagrams (filled in across sessions)
├── .github/workflows/         # CI/CD pipelines (filled in Session 1)
├── 01-LOCAL-SETUP.md          # Run it without Docker (pre-Session-1 prep)
├── 02-DOCKER-SETUP.md         # Run it with Docker (after Session 1)
└── README.md                  # This file
```
