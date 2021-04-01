locals {
  global = {
    project          = var.project,
    region           = var.region,
    zone             = var.zone,
    environment      = var.environment,
    location         = "${var.region}-${var.zone}",
    bucket_prefix    = var.bucket_prefix,
    cluster_name     = var.cluster_name,
    node_pool_count  = var.node_pool_count,
    min_node_count   = var.min_node_count,
    max_node_count   = var.max_node_count,
    machine_type     = var.machine_type,
    preemptible      = var.preemptible
  }
}

module "gke-cluster" {
  source = "../../../provisioning/gke-cluster-module"

  global = local.global
}

module "gcp-buckets" {
  source = "../../../provisioning/gcp-bucket-module"

  global = local.global
}

resource "google_compute_disk" "mongo_disk" {
  name  = "tectonic-mongo-disk"
  type  = "pd-ssd"
  zone  = var.zone
  size  = 300
}

resource "google_compute_disk" "elasticsearch_disk" {
  name  = "tectonic-elasticsearch-disk"
  type  = "pd-ssd"
  zone  = var.zone
  size  = 300
}