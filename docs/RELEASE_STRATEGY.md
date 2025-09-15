# Release Strategy

This document outlines our automated release strategy for the OpenRouter CLI project during its MVP development phase.

## Branch Strategy

### Feature Branches (`feature/*`)

- **Purpose**: Experimental features and new functionality
- **Release Type**: Beta releases
- **NPM Tag**: `beta`
- **Version Pattern**: `0.1.3-beta.0`, `0.1.3-beta.1`, etc. (next patch version + beta)
- **When to use**: When developing new features that may have breaking changes
- **Automation**: Automatic version bumping and publishing on push

### Main Branch (`main`)

- **Purpose**: Stable, production-ready releases
- **Release Type**: Stable releases
- **NPM Tag**: `latest`
- **Version Pattern**: `0.1.3`, `0.2.0`, `1.0.0`, etc. (semantic versioning based on commits)
- **When to use**: When features are thoroughly tested and stable
- **Automation**: Automatic semantic versioning based on conventional commits

## Development Workflow

1. **Create feature branch**: `feature/your-feature-name`
2. **Develop feature**: Push commits → Automatic beta releases (`0.1.3-beta.0`, `0.1.3-beta.1`)
3. **Test thoroughly**: Use beta NPM package for testing
4. **Merge to main**: When satisfied → Automatic stable release (semantic versioning: `0.2.0`, `1.0.0`, etc.)

## Automated Version Management

### Beta Versioning

- **Always bumps patch version first**, then adds prerelease identifier
- **Example**: Main at `0.1.2` → Feature branch → `0.1.3-beta.0`
- **Incremental**: Subsequent pushes increment the prerelease number
- **Automated**: No manual version management needed

### Main Release Versioning

- **Analyzes commit messages** using conventional commit format
- **Semantic versioning** based on actual changes:
  - `feat:` commits → Minor bump (`0.1.2` → `0.2.0`)
  - `fix:` commits → Patch bump (`0.1.2` → `0.1.3`)
  - `BREAKING CHANGE` → Major bump (`0.1.2` → `1.0.0`)
- **Automated**: No manual version decisions needed

### Git Integration

- **Automatic commits**: Version changes are committed back to the repository
- **Branch sync**: `package.json` always reflects current release state
- **Merge strategy**: Use regular merges (not squash) to preserve commit history

## Quality Gates

### Beta Releases

- ✅ Feature implemented
- ⚠️ May have breaking changes
- ⚠️ May have bugs
- 🎯 Target: Testing and early adopters

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

# Install specific version
npm install @letuscode/openrouter-cli@0.1.0-beta.1
```

## GitHub Releases

- **Beta**: Created automatically on feature/beta branches
- **Stable**: Created automatically on main branch
- **Tags**: Follow semantic versioning (v0.1.0, v0.1.0-beta.1, etc.)

## Automated Workflow Details

### GitHub Actions Workflow

- **File**: `.github/workflows/beta.yml`
- **Triggers**: Push to `feature/*` or `main`
- **Permissions**: Full repository access for automated commits
- **Features**:
  - Automatic version bumping
  - NPM publishing with correct tags
  - GitHub release creation
  - Git commit back to repository

### Version Bumping Logic

```bash
# Beta releases
Main: 0.1.2 → Feature branch → 0.1.3-beta.0

# Main releases (semantic versioning)
Commits: "feat: add feature" → 0.2.0
Commits: "fix: resolve bug" → 0.1.3
Commits: "BREAKING CHANGE" → 1.0.0
```

### Package.json Synchronization

- **Automatic updates**: Version changes are committed back to git
- **Branch consistency**: Each branch's `package.json` reflects its release state
- **No manual intervention**: Fully automated version management

## Commit Message Requirements

### Conventional Commits Format

Use the following commit message format for automatic semantic versioning:

```bash
# Features (minor bump)
feat: add new user dashboard
feat(api): implement new endpoint

# Fixes (patch bump)
fix: resolve authentication bug
fix(ui): update error message display

# Breaking changes (major bump)
feat!: remove deprecated API
BREAKING CHANGE: change authentication method
```

### Merge Strategy

- **Use regular merges** (not squash) to preserve individual commit messages
- **Commit-lint** ensures proper message format
- **Workflow reads** commit history to determine semantic version

## When to Release to Main

A feature is ready for main when:

- [ ] Feature is complete and tested
- [ ] No breaking changes (or breaking changes are documented)
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Beta testing shows no critical issues
- [ ] Performance is acceptable
- [ ] Security review completed (if applicable)
- [ ] Commit messages follow conventional format
