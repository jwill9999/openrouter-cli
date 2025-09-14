# Release Strategy

This document outlines our release strategy for the OpenRouter CLI project during its MVP development phase.

## Branch Strategy

### Feature Branches (`feature/*`)

- **Purpose**: Experimental features and new functionality
- **Release Type**: Alpha releases
- **NPM Tag**: `alpha`
- **Version Pattern**: `0.1.0-alpha.1`, `0.1.0-alpha.2`, etc.
- **When to use**: When developing new features that may have breaking changes

### Beta Branches (`beta/*`)

- **Purpose**: Feature-complete functionality ready for testing
- **Release Type**: Beta releases
- **NPM Tag**: `beta`
- **Version Pattern**: `0.1.0-beta.1`, `0.1.0-beta.2`, etc.
- **When to use**: When features are complete and ready for broader testing

### Main Branch (`main`)

- **Purpose**: Stable, production-ready releases
- **Release Type**: Stable releases
- **NPM Tag**: `latest`
- **Version Pattern**: `0.1.0`, `0.1.1`, `0.2.0`, etc.
- **When to use**: When features are thoroughly tested and stable

## Development Workflow

1. **Create feature branch**: `feature/your-feature-name`
2. **Develop feature**: Push commits → Automatic alpha releases
3. **Merge to beta**: `beta/your-feature-name`
4. **Test thoroughly**: Push commits → Automatic beta releases
5. **Merge to main**: When ready → Automatic stable release

## Quality Gates

### Alpha Releases

- ✅ Feature implemented
- ⚠️ May have breaking changes
- ⚠️ May have bugs
- 🎯 Target: Early adopters and internal testing

### Beta Releases

- ✅ Feature complete
- ✅ Basic testing done
- ⚠️ May have minor bugs
- 🎯 Target: Broader testing community

### Stable Releases

- ✅ Feature complete
- ✅ Thoroughly tested
- ✅ No known critical bugs
- ✅ Documentation updated
- 🎯 Target: General users

## Version Constraints

- **No 1.x.x releases** until truly production-ready
- **Stays in 0.x.x range** during MVP development
- **Semantic versioning** within 0.x.x range

## NPM Installation

```bash
# Install latest stable release
npm install @letuscode/openrouter-cli

# Install latest beta release
npm install @letuscode/openrouter-cli@beta

# Install latest alpha release
npm install @letuscode/openrouter-cli@alpha

# Install specific version
npm install @letuscode/openrouter-cli@0.1.0-beta.1
```

## GitHub Releases

- **Alpha/Beta**: Created automatically on feature/beta branches
- **Stable**: Created automatically on main branch
- **Tags**: Follow semantic versioning (v0.1.0, v0.1.0-alpha.1, etc.)

## When to Release to Main

A feature is ready for main when:

- [ ] Feature is complete and tested
- [ ] No breaking changes (or breaking changes are documented)
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Beta testing shows no critical issues
- [ ] Performance is acceptable
- [ ] Security review completed (if applicable)
