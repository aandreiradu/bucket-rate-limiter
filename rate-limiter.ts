import RateLimitError from "./rate-limit-error";

class RateLimiter {
  private readonly maxBucketSize = 120;
  private readonly bucketLimiter = 3;
  private bucketMap = new Map<string, number>();
  private static instance: RateLimiter | null = null;

  constructor() {
    if (RateLimiter.instance) {
      return RateLimiter.instance;
    }

    RateLimiter.instance = this;
  }

  public triggerCall(ip: string) {
    if (typeof ip !== "string") {
      throw new RateLimitError(
        `Invalid input. Expected string, received ${typeof ip}`
      );
    }

    if (this.bucketMap.size > this.maxBucketSize) {
      throw new RateLimitError(
        "Currently the bucket is full. Subscribers will be notified when the bucket is available"
      );
    }

    if (!this.bucketMap.get(ip)) {
      this.bucketMap.set(ip, 1);
    } else {
      let callNo = this.bucketMap.get(ip) || 0;
      if (callNo < this.bucketLimiter) {
        this.bucketMap.set(ip, ++callNo);
      } else {
        throw new RateLimitError(`Limit exceeded for ip: ${ip}`);
      }
    }
  }

  /*
   * TODO: develop bucket limit reset
           subscribers
           
   */
}

const ip1 = new RateLimiter();
ip1.triggerCall("192.168.0.1");
ip1.triggerCall("192.168.0.1");
const ip2 = new RateLimiter();
ip2.triggerCall("192.168.0.1");
ip2.triggerCall("192.168.0.2");
ip2.triggerCall("192.168.0.2");
ip2.triggerCall("192.168.0.2");
ip2.triggerCall("192.168.0.2"); // Limit Exceeded
