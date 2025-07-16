; Probe Right-Edge

#<_probe_clearance> = [#<_xy_clearance>] - [#<_probe_diameter> / 2]

G91                         ; relative mode

(--- 1 PROBE X ---)
; Pull away from edge in X+ by #<_xy_clearance>
G1 X[+#<_xy_clearance>] F[#<_rapid_fr>]

; Move Z down by #<_probing_depth>
G1 Z[-#<_probing_depth>] F[#<_rapid_fr>]

; Probe X- (search + latch)
G38.2 X[-#<_probing_dist>] F[#<_search_fr>]   ; search pass
G1 X[+#<_latch_dist>] F[#<_rapid_fr>]      ; back off
G38.2 X[-#<_latch_dist>] F[#<_latch_fr>]   ; latch pass

; Retract X
G1 X[+#<_xy_clearance>] F[#<_rapid_fr>]

; Move Z up
G1 Z[+#<_probing_depth>] F[#<_rapid_fr>]

; Return to edge
G1 X[-#<_probe_clearance>] F[#<_rapid_fr>]
; Finally zero out
G10 L20 P0 X0
G90