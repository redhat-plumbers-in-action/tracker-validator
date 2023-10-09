<!-- markdownlint-disable MD033 MD041 -->
<p align="center">
  <img src="https://github.com/redhat-plumbers-in-action/team/blob/6d8bd1a33a783c762e22c668427922bfd8b01e40/members/purple-plumber.png" width="100" />
  <h1 align="center">Tracker Validator</h1>
</p>

[![GitHub Marketplace][market-status]][market] [![Lint Code Base][linter-status]][linter] [![Unit Tests][test-status]][test] [![CodeQL][codeql-status]][codeql] [![Check dist/][check-dist-status]][check-dist]

[![codecov][codecov-status]][codecov]

<!-- Status links -->

[market]: https://github.com/marketplace/actions/tracker-validator
[market-status]: https://img.shields.io/badge/Marketplace-Tracker%20Validator-blue.svg?colorA=24292e&colorB=0366d6&style=flat&longCache=true&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAM6wAADOsB5dZE0gAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAERSURBVCiRhZG/SsMxFEZPfsVJ61jbxaF0cRQRcRJ9hlYn30IHN/+9iquDCOIsblIrOjqKgy5aKoJQj4O3EEtbPwhJbr6Te28CmdSKeqzeqr0YbfVIrTBKakvtOl5dtTkK+v4HfA9PEyBFCY9AGVgCBLaBp1jPAyfAJ/AAdIEG0dNAiyP7+K1qIfMdonZic6+WJoBJvQlvuwDqcXadUuqPA1NKAlexbRTAIMvMOCjTbMwl1LtI/6KWJ5Q6rT6Ht1MA58AX8Apcqqt5r2qhrgAXQC3CZ6i1+KMd9TRu3MvA3aH/fFPnBodb6oe6HM8+lYHrGdRXW8M9bMZtPXUji69lmf5Cmamq7quNLFZXD9Rq7v0Bpc1o/tp0fisAAAAASUVORK5CYII=

[linter]: https://github.com/redhat-plumbers-in-action/tracker-validator/actions/workflows/lint.yml
[linter-status]: https://github.com/redhat-plumbers-in-action/tracker-validator/actions/workflows/lint.yml/badge.svg

[test]: https://github.com/redhat-plumbers-in-action/tracker-validator/actions/workflows/unit-tests.yml
[test-status]: https://github.com/redhat-plumbers-in-action/tracker-validator/actions/workflows/unit-tests.yml/badge.svg

[codeql]: https://github.com/redhat-plumbers-in-action/tracker-validator/actions/workflows/codeql-analysis.yml
[codeql-status]: https://github.com/redhat-plumbers-in-action/tracker-validator/actions/workflows/codeql-analysis.yml/badge.svg

[check-dist]: https://github.com/redhat-plumbers-in-action/tracker-validator/actions/workflows/check-dist.yml
[check-dist-status]: https://github.com/redhat-plumbers-in-action/tracker-validator/actions/workflows/check-dist.yml/badge.svg

[codecov]: https://codecov.io/github/redhat-plumbers-in-action/tracker-validator
[codecov-status]: https://codecov.io/github/redhat-plumbers-in-action/tracker-validator/graph/badge.svg?token=LKx67sWeC6

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
    pr-metadata:        <pr-metadata.json>
    config-path:        <path to config file>
    tracker:            <tracker ID>
    tracker-type:       <tracker type>
    product:            <product name>
    component:          <component name>
    bugzilla-instance:  <Bugzilla instance URL>
    bugzilla-api-token: <Bugzilla API token>
    jira-instance:      <Jira instance URL>
    jiira-api-token:    <Jira API token>
    token:              <GitHub token or PAT>

# ...
```

### pr-metadata

Stringified JSON Pull Request metadata provided by GitHub Action [`redhat-plumbers-in-action/gather-pull-request-metadata`](https://github.com/redhat-plumbers-in-action/gather-pull-request-metadata).

Pull Request metadata has the following format: [metadata format](https://github.com/redhat-plumbers-in-action/gather-pull-request-metadata#metadata)

* default value: `undefined`
* requirements: `required`

### config-path

Path to configuration file. Configuration file format is described in: [Configuration section](#Configuration).

* default value: `.github/tracker-validator.yml`
* requirements: `optional`

### tracker

The tracker identificator. For example, for Bugzilla: `tracker: 1234567`.

* default value: `undefined`
* requirements: `required`

### tracker-type

The tracker type. Currently supported: `bugzilla` and `jira`.

* default value: `undefined`
* requirements: `required`

### component

Component name is used for validation if provided tracker is targeting the expected component. For example, for Bugzilla: `component: systemd`. If component is not provided, validation will be skipped.

* default value: `undefined`
* requirements: `optional`

### bugzilla-instance

The URL of the Bugzilla instance on which will be performed API requests and validation of trackers. For example: `bugzilla-instance: https://bugzilla.redhat.com`.

* default value: `undefined`
* requirements: `optional`

### bugzilla-api-token

The Bugzilla API token is used for performing API requests. The token should be stored as GitHub secret. Never paste the token directly into the workflow file.

* default value: `undefined`
* requirements: `optional`

### jira-instance

The URL of the Jira instance on which will be performed API requests and validation of trackers. For example: `jira-instance: https://issues.redhat.com`.

* default value: `undefined`
* requirements: `required`

### jiira-api-token

The Jira API token is used for performing API requests. The token should be stored as GitHub secret. Never paste the token directly into the workflow file.

* default value: `undefined`
* requirements: `optional`

### token

GitHub token or PAT is used for creating comments on Pull Request and setting checks.

```yml
# required permission
permissions:
  checks: write
  pull-requests: write
```

* default value: `undefined`
* requirements: `required`
* recomended value: `secrets.GITHUB_TOKEN`

## Configuration

### product

Product name is used for validation if provided tracker is targeting the expected product. For example, for Bugzilla: `product: Red Hat Enterprise Linux 9`. If product is not provided, validation will be skipped.

* default value: `undefined`
* requirements: `optional`

> ...

## Limitations

> ...
