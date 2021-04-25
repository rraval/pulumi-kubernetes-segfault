import * as gcp from "@pulumi/gcp";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

const clusterName = "pulumi-segfault";

const cluster = gcp.container.getCluster({
    name: "zeroindexed",
    location: "us-central1",
});

const kubeconfig = pulumi.all([cluster]).apply(([gotCluster]) => {
    const context = `${gcp.config.project}_${gcp.config.zone}_${gotCluster.name}`;
    return `apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ${gotCluster.masterAuths[0].clusterCaCertificate}
    server: https://${gotCluster.endpoint}
name: ${context}
contexts:
- context:
    cluster: ${context}
    user: ${context}
name: ${context}
current-context: ${context}
kind: Config
preferences: {}
users:
- name: ${context}
user:
    auth-provider:
    config:
        cmd-args: config config-helper --format=json
        cmd-path: gcloud
        expiry-key: '{.credential.token_expiry}'
        token-key: '{.credential.access_token}'
    name: gcp
`;
});

const provider = new k8s.Provider(clusterName, {
    kubeconfig,
});
