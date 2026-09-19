# RootCause Deterministic Allocation Algorithm

## Overview
RootCause implements a 100-point transparent multi-factor scoring rubric. Every match decision produces an audit trail of mathematical point attributions and specific justification tags.

---

## 1. Hard Eligibility Filter (Zero Tolerance)

Before scoring begins, candidate supplies must pass strict binary filters:
1. **Resource Type Match**: Normalized case-insensitive match ($R_{\text{supply}} = R_{\text{demand}}$).
2. **Reserve Boundary**:
   $$\text{Usable} = Q_{\text{supply}} - Q_{\text{reserve}} > 0$$
3. **Quantity Threshold**:
   - If `allow_partial = False`: $\text{Usable} \ge Q_{\text{demand}}$
   - If `allow_partial = True`: $\text{Usable} > 0$
4. **Availability Window**:
   $$T_{\text{start}} \le T_{\text{needed}} \le T_{\text{expiry}}$$
5. **Provider Operational Status**: Must be `"available"`.

---

## 2. 100-Point Scoring Formulation

Total score $S \in [0, 100]$ is computed as:
$$S = S_{\text{compat}} + S_{\text{urgency}} + S_{\text{qty}} + S_{\text{dist}} + S_{\text{time}}$$

### Component Breakdown:

#### 1. Resource Compatibility ($S_{\text{compat}} \in [0, 30]$)
- Exact normalized match = **30 points**.

#### 2. Urgency Multiplier ($S_{\text{urgency}} \in [0, 25]$)
Prioritizes high-stakes immediate threats:
- **CRITICAL**: 25 points
- **HIGH**: 20 points
- **MEDIUM**: 12 points
- **LOW**: 5 points

#### 3. Quantity Availability ($S_{\text{qty}} \in [0, 20]$)
- Full fulfillment ($\text{Usable} \ge Q_{\text{demand}}$): **20 points**
- Partial fulfillment:
  $$S_{\text{qty}} = \min\left(20, \frac{\text{Usable}}{Q_{\text{demand}}} \times 20\right)$$

#### 4. Geographic Proximity via Haversine ($S_{\text{dist}} \in [0, 15]$)
Calculates great-circle distance between requester $(\varphi_1, \lambda_1)$ and provider $(\varphi_2, \lambda_2)$:
$$\Delta \varphi = \varphi_2 - \varphi_1, \quad \Delta \lambda = \lambda_2 - \lambda_1$$
$$a = \sin^2\left(\frac{\Delta \varphi}{2}\right) + \cos \varphi_1 \cos \varphi_2 \sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$d = 2 R \cdot \arcsin(\sqrt{a}) \quad (R = 6371\text{ km})$$

Distance score decays smoothly with distance (up to maximum operational radius $D_{\max} = 100\text{ km}$):
$$S_{\text{dist}} = 15 \times \max\left(0, 1 - \frac{d}{D_{\max}}\right)$$

#### 5. Time Window Buffer ($S_{\text{time}} \in [0, 10]$)
Awards points for safety buffers before the critical operational deadline:
- Buffer $> 24$ hours: **10 points**
- Buffer between $6$ and $24$ hours: **7 points**
- Buffer $< 6$ hours: **4 points**
- No deadline specified: baseline **5 points**

---

## 3. Alternative Candidates & Auditability
Candidates are ranked in descending order of score. The top candidate is chosen as the system recommendation, while the subsequent top 3 candidates are retained as backup alternatives for the incident commander.
