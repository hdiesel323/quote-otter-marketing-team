# QuoteOtter AI Lead Generation System

## Overview
Production-ready AI agent system for intelligent lead qualification, fraud detection, and provider matching. Built for QuoteOtter's multi-service lead generation platform.

## Architecture
Multi-agent collaborative system with specialized roles:

### Core Agents
1. **Lead Intelligence Agent** - Lead qualification, scoring, and routing
2. **Conversion Analytics Agent** - Lead quality tracking and ROI analysis
3. **Compliance & Quality Agent** - Fraud detection (PhoneRevealr integration) and quality assurance
4. **Lead Operations Agent** - Lead distribution and provider coordination
5. **Provider Intelligence Agent** - Provider matching and performance optimization

### Supporting Agents
6. **Service Category Agent** - Category-specific expertise (Home Services, Insurance, Moving, Legal, Financial, Auto)
7. **Pricing Intelligence Agent** - Market pricing analysis and quote validation
8. **Follow-Up Agent** - Lead nurturing and conversion optimization
9. **Reporting Agent** - Automated reporting for providers and internal metrics

## Directory Structure
```
quote-otter-agent-system/
├── agents/                 # Individual agent configurations
│   ├── lead-intelligence/
│   ├── conversion-analytics/
│   ├── compliance/
│   ├── lead-operations/
│   └── provider-intelligence/
├── teams/                  # Multi-agent team configurations
├── workflows/              # Lead gen workflow definitions
├── templates/              # Reusable templates
├── guardrails/            # Fraud detection and quality rules
├── integrations/          # PhoneRevealr, CRM, and platform APIs
├── deployment/            # Coolify Docker configurations
└── documentation/         # Implementation guides
```

## Features
- ✅ Real-time lead qualification and scoring
- ✅ PhoneRevealr fraud detection integration (VoIP detection, carrier validation)
- ✅ Intelligent provider matching based on performance
- ✅ Multi-service category support (46+ service types)
- ✅ Conversion tracking and ROI optimization
- ✅ Automated lead distribution workflows
- ✅ Docker deployment on Coolify
- ✅ API integration with QuoteOtter Next.js platform

## Status
🚀 Active Development - Transforming from campaign management to lead generation

## Deployment
Last deployed: 2025-11-13 - Coolify webhook integration active
