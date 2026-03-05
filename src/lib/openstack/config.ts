export interface OpenStackConfig {
  authUrl: string;
  username: string;
  password: string;
  projectName: string;
  userDomainName: string;
  projectDomainName: string;
  regionName: string;
}

export function getOpenStackConfig(): OpenStackConfig {
  const authUrl = process.env.OS_AUTH_URL;
  const username = process.env.OS_USERNAME;
  const password = process.env.OS_PASSWORD;
  const projectName = process.env.OS_PROJECT_NAME;
  const userDomainName = process.env.OS_USER_DOMAIN_NAME || "Default";
  const projectDomainName = process.env.OS_PROJECT_DOMAIN_NAME || "Default";
  const regionName = process.env.OS_REGION_NAME || "RegionOne";

  if (!authUrl || !username || !password || !projectName) {
    throw new Error(
      "Missing OpenStack configuration. Please set OS_AUTH_URL, OS_USERNAME, OS_PASSWORD, and OS_PROJECT_NAME environment variables."
    );
  }

  return {
    authUrl,
    username,
    password,
    projectName,
    userDomainName,
    projectDomainName,
    regionName,
  };
}

export function isOpenStackConfigured(): boolean {
  return !!(
    process.env.OS_AUTH_URL &&
    process.env.OS_USERNAME &&
    process.env.OS_PASSWORD &&
    process.env.OS_PROJECT_NAME
  );
}
