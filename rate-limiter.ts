import RateLimitError from "./rate-limit-error";

interface RateLimiterIP {
  ip: string;
  blocked: boolean;
  last_request_timestamp: number;
  blocked_until_timestamp: number;
  requestCount: number;
}

class RateLimiter {
  private readonly maxBucketSize = 120;
  private readonly bucketLimiter = 3;
  private bucketMap = new Map<string, RateLimiterIP>();
  private static instance: RateLimiter | null = null;
  private readonly not_allowed_calls_minutes = 1;

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

    const existingIP = this.bucketMap.get(ip);
    const now = Date.now();
    if (!existingIP) {
      this.bucketMap.set(ip, {
        ip: ip,
        blocked: false,
        blocked_until_timestamp: 0,
        last_request_timestamp: now,
        requestCount: 1,
      });
    } else {
      const {
        blocked,
        blocked_until_timestamp,
        last_request_timestamp,
        requestCount,
      } = existingIP;

      if (requestCount >= this.bucketLimiter) {
        if (!blocked) {
          this.bucketMap.set(ip, {
            ...existingIP,
            blocked: true,
            last_request_timestamp: now,
            blocked_until_timestamp:
              now + this.not_allowed_calls_minutes * 60000,
          });

          throw new RateLimitError(`Limit exceeded for IP ${ip}`);
        } else {
          if (now > blocked_until_timestamp && now > last_request_timestamp) {
            console.log("Limit exceeded, but time expired => reset");
            this.bucketMap.set(ip, {
              ...existingIP,
              blocked: false,
              last_request_timestamp: now,
              blocked_until_timestamp: 0,
              requestCount: 1,
            });
          }
        }
      } else {
        this.bucketMap.set(ip, {
          ...existingIP,
          blocked: false,
          last_request_timestamp: now,
          blocked_until_timestamp: 0,
          requestCount: requestCount + 1,
        });
      }
    }
  }

  /*
   * TODO: develop bucket limit reset
           subscribers
           
   */
}
const ip1 = new RateLimiter();
const ip2 = new RateLimiter();
try {
  ip1.triggerCall("192.168.0.1");
  ip1.triggerCall("192.168.0.1");

  ip2.triggerCall("192.168.0.1");
  ip2.triggerCall("192.168.0.2");
  ip2.triggerCall("192.168.0.2");
  ip2.triggerCall("192.168.0.2");
  ip2.triggerCall("192.168.0.2"); // Limit Exceeded
  console.log("call again after exceeding limit");
  ip2.triggerCall("192.168.0.2");
} catch (error) {
  console.log("calling again from catch");
  ip2.triggerCall("192.168.0.2");
}
