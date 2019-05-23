from fabric.api import run, env, cd, local

env.hosts = ["dirsv"]
env.use_ssh_config = True

def gdeploy():
    local("git push");
    deploy()

def deploy():
    deploy_dir = "/home/ubuntu/Open-Directory/"
    with cd(deploy_dir):
        run("git pull")

