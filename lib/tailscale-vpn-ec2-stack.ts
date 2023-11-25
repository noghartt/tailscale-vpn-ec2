import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CloudFormationInit, InitCommand, InitFile, Instance, InstanceType, IpAddresses, MachineImage, OperatingSystemType, SubnetType, UserData, Vpc } from 'aws-cdk-lib/aws-ec2';

interface ExitNodeProps extends cdk.StackProps {
  tailscaleAuthKey: string,
  exitNodeName: string
}

export class TailscaleVpnEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ExitNodeProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, 'ExitNodeVPC', {
      ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'tailscale',
          subnetType: SubnetType.PUBLIC,
        },
      ],
    });

    const publicSubnets = vpc.selectSubnets({
      subnetType: SubnetType.PUBLIC,
    });

    const machineImage = MachineImage.fromSsmParameter(
      '/aws/service/canonical/ubuntu/server/jammy/stable/current/amd64/hvm/ebs-gp2/ami-id',
    );

    const userData = UserData.forLinux();
    userData.addCommands(
      // Enable ip forwarding 
      "echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf",
      "echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.conf",
      "sysctl -p /etc/sysctl.conf",

      // Install tailscale
      "curl -fsSL https://tailscale.com/install.sh | sh",
      `tailscale up --authkey ${props.tailscaleAuthKey} --advertise-exit-node --hostname=${props.exitNodeName}`
    );

    const instance = new Instance(this, "exitNode", {
      instanceType: new InstanceType("t3.micro"),
      vpc,
      instanceName: props.exitNodeName,
      vpcSubnets: publicSubnets,
      machineImage,
      userData,
    });
  }
}
