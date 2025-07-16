; Probe Centre

#<_probe_retract> = [#<_probing_depth> + #<_probe_diameter> / 2]
#<_probe_clearance> = [#<_probe_retract> - #<_probe_diameter> / 2]

G91                         ; relative mode

; Probe Z- (search + latch)
G38.2 Z[-#<_probing_dist>] F[#<_search_fr>]   ; search pass
G1 Z[+#<_latch_dist>] F[#<_rapid_fr>]      ; back off
G38.2 Z[-#<_latch_dist>] F[#<_latch_fr>]   ; latch pass

; Retract Z
G1 Z[+#<_probing_depth>] F[#<_rapid_fr>]

; zero out
G10 L20 P0 Z[#<_probe_retract>]
G90