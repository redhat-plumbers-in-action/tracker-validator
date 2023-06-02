<!-- markdownlint-disable MD033 MD041 -->
<p align="center">
  <img src="https://github.com/redhat-plumbers-in-action/team/blob/70f67465cc46e02febb16aaa1cace2ceb82e6e5c/members/black-plumber.png" width="100" />
  <h1 align="center">Tracker Validator</h1>
</p>

[![GitHub Marketplace][market-status]][market] [![Lint Code Base][linter-status]][linter] [![Unit Tests][test-status]][test] [![CodeQL][codeql-status]][codeql] [![Check dist/][check-dist-status]][check-dist]

[![codecov][codecov-status]][codecov] [![Mergify Status][mergify-status]][mergify]

<!-- Status links -->

[market]: https://github.com/marketplace/actions/tracker-validator
[market-status]: https://img.shields.io/badge/Marketplace-Typescript%20Action-blue.svg?colorA=24292e&colorB=0366d6&style=flat&longCache=true&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAM6wAADOsB5dZE0gAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAERSURBVCiRhZG/SsMxFEZPfsVJ61jbxaF0cRQRcRJ9hlYn30IHN/+9iquDCOIsblIrOjqKgy5aKoJQj4O3EEtbPwhJbr6Te28CmdSKeqzeqr0YbfVIrTBKakvtOl5dtTkK+v4HfA9PEyBFCY9AGVgCBLaBp1jPAyfAJ/AAdIEG0dNAiyP7+K1qIfMdonZic6+WJoBJvQlvuwDqcXadUuqPA1NKAlexbRTAIMvMOCjTbMwl1LtI/6KWJ5Q6rT6Ht1MA58AX8Apcqqt5r2qhrgAXQC3CZ6i1+KMd9TRu3MvA3aH/fFPnBodb6oe6HM8+lYHrGdRXW8M9bMZtPXUji69lmf5Cmamq7quNLFZXD9Rq7v0Bpc1o/tp0fisAAAAASUVORK5CYII=

[linter]: https://github.com/redhat-plumbers-in-action/tracker-validator/actions/workflows/lint.yml
[linter-status]: https://github.com/redhat-plumbers-in-action/tracker-validator/actions/workflows/lint.yml/badge.svg

[test]: https://github.com/redhat-plumbers-in-action/tracker-validator/actions/workflows/unit-tests.yml
[test-status]: https://github.com/redhat-plumbers-in-action/tracker-validator/actions/workflows/unit-tests.yml/badge.svg

[codeql]: https://github.com/redhat-plumbers-in-action/tracker-validator/actions/workflows/codeql-analysis.yml
[codeql-status]: https://github.com/redhat-plumbers-in-action/tracker-validator/actions/workflows/codeql-analysis.yml/badge.svg

[check-dist]: https://github.com/redhat-plumbers-in-action/tracker-validator/actions/workflows/check-dist.yml
[check-dist-status]: https://github.com/redhat-plumbers-in-action/tracker-validator/actions/workflows/check-dist.yml/badge.svg

[codecov]: https://codecov.io/gh/redhat-plumbers-in-action/tracker-validator
[codecov-status]: https://codecov.io/gh/redhat-plumbers-in-action/tracker-validator/branch/main/graph/badge.svg

[mergify]: https://mergify.com
[mergify-status]: https://img.shields.io/endpoint.svg?url=https://api.mergify.com/v1/badges/redhat-plumbers-in-action/tracker-validator&style=flat

<!-- -->

The purpose of this action is to offer reliable validator Red Hat trackers like [Bugzilla](https://bugzilla.redhat.com/) and [JIRA](https://issues.redhat.com).

## How does it work

> TBD

## Features

* product, component and flags validation
* feedback in form of labels and status check directly on Pull Requests

## Usage

```yml
name: Gather Pull Request Metadata
on:
  pull_request:
    types: [ opened, reopened, synchronize ]
    branches: [ main ]

permissions:
  contents: read

jobs:
  gather-metadata:
    runs-on: ubuntu-latest

    steps:
      - name: Repository checkout
        uses: actions/checkout@v3

      - id: Metadata
        name: Gather Pull Request Metadata
        uses: redhat-plumbers-in-action/gather-pull-request-metadata@v1

      - name: Upload artifact with gathered metadata
        uses: actions/upload-artifact@v3
        with:
          name: pr-metadata
          path: ${{ steps.Metadata.outputs.metadata-file }}
```

```yml
name: Tracker Validator
on:
  workflow_run:
    workflows: [ Gather Pull Request Metadata ]
    types:
      - completed

permissions:
  contents: read

jobs:
  download-metadata:
    if: >
      github.event.workflow_run.event == 'pull_request' &&
      github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest

    outputs:
      pr-metadata: ${{ steps.Artifact.outputs.pr-metadata-json }}

    steps:
      - id: Artifact
        name: Download Artifact
        uses: redhat-plumbers-in-action/download-artifact@v1
        with:
          name: pr-metadata

  commit-linter:
    needs: [ download-metadata ]
    runs-on: ubuntu-latest

    outputs:
      validated-pr-metadata: ${{ steps.commit-linter.outputs.validated-pr-metadata }}

    permissions:
      # required for creation of checks
      checks: write
      # required for PR comments and set labels
      pull-requests: write

    steps:
      - id: commit-linter
        name: Lint Commits
        uses: redhat-plumbers-in-action/advanced-commit-linter@v1
        with:
          pr-metadata: ${{ needs.download-metadata.outputs.pr-metadata }}
          token: ${{ secrets.GITHUB_TOKEN }}

  tracker-validator:
    needs: [ download-metadata, commit-linter ]
    runs-on: ubuntu-latest

    outputs:
      validated-pr-metadata: ${{ steps.commit-linter.outputs.validated-pr-metadata }}

    permissions:
      # required for creation of checks
      checks: write
      # required for PR comments and set labels
      pull-requests: write

    steps:
      - name: Get Tracker ID
        run:
          validated-pr-metadata

      - id: tracker-validator
        name: Validate Tracker
        uses: redhat-plumbers-in-action/tracker-validator@v1
        with:
          pr-metadata: ${{ needs.download-metadata.outputs.pr-metadata }}
          product: Red Hat Enterprise Linux 9
          component: systemd
          bugzilla-tracker: 
          bugzilla-instance: https://bugzilla.stage.redhat.com
          bugzilla-api-token: ${{ secrets.BUGZILLA_API_TOKEN }}
          token: ${{ secrets.GITHUB_TOKEN }}
```

### Real-life examples

> ...

## Configuration options

Action currently accepts the following options:

```yml
# ...

- uses: redhat-plumbers-in-action/tracker-validator@v1
  with:
    milliseconds: <number>

# ...
```

### milliseconds

> ...

> * default value: `undefined`
> * requirements: `required`

## Policy

> ...

## Limitations

> ...
