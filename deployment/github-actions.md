# GitHub Actions deployment configuration

The production workflow runs after a push to `main` in
`maaze18864-web/codeskill`. Configure authentication in that repository's
**Settings → Secrets and variables → Actions**. Settings in a fork do not
configure the upstream repository's deployment.

Choose one method:

- **OIDC:** set repository variable `AWS_ROLE_TO_ASSUME` to an existing IAM
  deployment role's ARN. A repository secret with the same name is also
  supported. The role must already trust GitHub's OIDC provider for this
  repository's `main` branch and the `sts.amazonaws.com` audience. Check the
  actual subject claim for this repository; GitHub's format can include
  repository/owner IDs or an environment. The workflow already requests
  `id-token: write`. No IAM role or other AWS resource is created by this change.
- **Access keys:** set repository secrets `AWS_ACCESS_KEY_ID` and
  `AWS_SECRET_ACCESS_KEY` for the existing deployment identity. Set
  `AWS_SESSION_TOKEN` as well when using temporary credentials; those credentials
  must still be valid when the deployment runs.

When both methods are configured, OIDC takes precedence. Keep credentials in
Actions secrets and never put them into workflow YAML, repository variables,
source files, or job output.

The identity needs the existing release upload and Auto Scaling refresh
permissions. Preserve the existing bucket, ASG, region and IAM permission scope.
Use the [AWS credential action documentation](https://github.com/aws-actions/configure-aws-credentials)
and [GitHub's AWS OIDC guide](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
to verify the existing trust configuration.

The early check validates that a configuration is present. AWS authenticates
immediately before upload, after tests and builds, as before. The check never
prints credential values and cannot establish whether a key is valid, a role's
trust policy is correct, or the identity has sufficient AWS permissions.

If the workflow reports **AWS deployment is not configured**, a repository
administrator must add one of the configurations above. If it fails in the
credential action after passing that check, inspect credential expiry, role
trust and repository access. Do not make the upload/refresh steps optional or
report deployment success when authentication fails.

Public pull-request validation exercises the configuration checker with dummy
values and runs tests/builds without production AWS credentials. A green PR
check confirms source validation; successful production deployment additionally
requires AWS authentication and successful upload/instance-refresh steps.
