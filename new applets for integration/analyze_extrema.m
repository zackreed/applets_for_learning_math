function out = analyze_extrema(f, xInterval, yInterval, varargin)
%ANALYZE_EXTREMA  Classify extrema of f(x,y) on a rectangle and plot.
%
%   out = analyze_extrema(f)
%   out = analyze_extrema(f, [ax bx], [ay by])
%   out = analyze_extrema(..., 'ShowAnalysis', true/false, 'Plot', true/false)
%
% Inputs
%   f         : sym or symfun of (x,y)
%   [ax bx]   : optional x-range (default: dynamic around crit pts; fallback [-10,10])
%   [ay by]   : optional y-range (default: dynamic around crit pts; fallback [-10,10])
%
% Options
%   'ShowAnalysis' : print tables and global extrema (default: false)
%   'Plot'         : show surface and markers (default: true)
%   'GridSize'     : [Nx Ny] for surface (default: [151 151])
%
% Output fields
%   out.interior  : table (x,y,f,D,fxx,class)
%   out.edges     : table (x,y,f,edge,where,class)
%   out.corners   : table (x,y,f)
%   out.globalMax : table (x,y,f,source)
%   out.globalMin : table (x,y,f,source)
%   out.axes      : axes handle used for plot (or [])
%   out.domain    : [ax bx; ay by] rectangle used for analysis/plot

% -------------------- options --------------------
p = inputParser;
addParameter(p,'ShowAnalysis',false,@(b)islogical(b)&&isscalar(b));
addParameter(p,'Plot',true,@(b)islogical(b)&&isscalar(b));
addParameter(p,'GridSize',[151 151],@(v)isnumeric(v)&&numel(v)==2);
addParameter(p,'ClearCache',false,@(b)islogical(b)&&isscalar(b));
parse(p,varargin{:});
showAnalysis = p.Results.ShowAnalysis;
doPlot       = p.Results.Plot;
gridSize     = p.Results.GridSize;
if p.Results.ClearCache
    clear functions  % Clears persistent variables in nested functions
end

% -------------------- coerce to sym(x,y) --------------------
if isa(f,'symfun')
    an = argnames(f);
    if numel(an) ~= 2, error('symfun must have exactly two arguments (x,y).'); end
    x = an(1); y = an(2);
    fs = formula(f);
elseif isa(f,'sym')
    syms x y
    vars = symvar(f);
    if numel(vars) < 2
        error('Symbolic expression must depend on two variables.');
    end
    % Map the first two vars to (x,y)
    fs = subs(f, [vars(1) vars(2)], [x y]);
else
    error('f must be a sym or symfun.');
end

% -------------------- derivatives --------------------
fx  = diff(fs, x);
fy  = diff(fs, y);
fxx = diff(fx, x);
fyy = diff(fy, y);
fxy = diff(fx, y);

% -------------------- interior critical points --------------------
Xint = []; Yint = [];
try
    S = solve([fx==0, fy==0], [x y], 'Real', true, 'IgnoreAnalyticConstraints', true);
    if ~isempty(S)
        xi = double(S.x);
        yi = double(S.y);
        good = isfinite(xi) & isfinite(yi);
        Xint = xi(good); Yint = yi(good);
    end
catch
    % If solve fails, leave interior empty
    Xint = []; Yint = [];
end
[Xint, Yint] = dedup2D(Xint, Yint, 1e-10);

% -------------------- decide domain --------------------
explicitDomain = (nargin >= 3) && ~isempty(xInterval) && ~isempty(yInterval);

if explicitDomain
    validateattributes(xInterval,{'numeric'},{'vector','numel',2});
    validateattributes(yInterval,{'numeric'},{'vector','numel',2});
    ax = min(xInterval); bx = max(xInterval);
    ay = min(yInterval); by = max(yInterval);
else
    % Dynamic: include up to first 10 crits (if any), else fallback
    if isempty(Xint)
        ax = -10; bx = 10; ay = -10; by = 10;
    else
        k = min(10, numel(Xint));
        Xs = Xint(1:k); Ys = Yint(1:k);
        padx = max(1, 0.15*max(1,range_(Xs)));
        pady = max(1, 0.15*max(1,range_(Ys)));
        ax = min(Xs) - padx; bx = max(Xs) + padx;
        ay = min(Ys) - pady; by = max(Ys) + pady;
        % If degenerate (all equal), widen a bit
        if ax==bx, ax = ax-1; bx = bx+1; end
        if ay==by, ay = ay-1; by = by+1; end
    end
end

% Validate domain is finite
if ~all(isfinite([ax bx ay by]))
    warning('Dynamic domain produced non-finite bounds. Using fallback.');
    ax = -10; bx = 10; ay = -10; by = 10;
end

% Filter interior points into the rectangle (for classification)
inRect = Xint >= ax & Xint <= bx & Yint >= ay & Yint <= by;
Xint = Xint(inRect); Yint = Yint(inRect);

% -------------------- classify interior --------------------
intTab = table([],[],[],[],[],[],'VariableNames',{'x','y','f','D','fxx','class'});
for k = 1:numel(Xint)
    xx = Xint(k); yy = Yint(k);
    fxxv = safe_double(subs(fxx,[x y],[xx yy]));
    fyyv = safe_double(subs(fyy,[x y],[xx yy]));
    fxyv = safe_double(subs(fxy,[x y],[xx yy]));
    D    = fxxv*fyyv - fxyv^2;
    fv   = eval_sym_safe(fs, x, y, xx, yy);
    cls  = classify_hessian(D, fxxv);
    intTab = [intTab; {xx, yy, fv, D, fxxv, cls}]; %#ok<AGROW>
end

% -------------------- boundary analysis (4 edges) --------------------
edgeTab = table([],[],[],[],[],[],'VariableNames',{'x','y','f','edge','where','class'});
edgeTab = [edgeTab; analyze_edge_1d(fs, x, y, 'y=ay', x, ax, bx, y, ay)]; %#ok<AGROW>
edgeTab = [edgeTab; analyze_edge_1d(fs, x, y, 'y=by', x, ax, bx, y, by)]; %#ok<AGROW>
edgeTab = [edgeTab; analyze_edge_1d(fs, x, y, 'x=ax', y, ay, by, x, ax)]; %#ok<AGROW>
edgeTab = [edgeTab; analyze_edge_1d(fs, x, y, 'x=bx', y, ay, by, x, bx)]; %#ok<AGROW>
edgeTab = dedupRows(edgeTab);

% -------------------- corners --------------------
corners = [ax ay; ax by; bx ay; bx by];
cornTab = table(corners(:,1), corners(:,2), ...
    eval_sym_safe(fs, x, y, corners(:,1), corners(:,2)), ...
    'VariableNames', {'x','y','f'});

% -------------------- global extrema --------------------
candX = [intTab.x; edgeTab.x; cornTab.x];
candY = [intTab.y; edgeTab.y; cornTab.y];
candF = [intTab.f; edgeTab.f; cornTab.f];

[fmax, imax] = max(candF);
[fmin, imin] = min(candF);
srcMax = source_of(candX(imax), candY(imax), intTab, edgeTab, cornTab);
srcMin = source_of(candX(imin), candY(imin), intTab, edgeTab, cornTab);

globalMax = table(candX(imax), candY(imax), fmax, string(srcMax), ...
    'VariableNames', {'x','y','f','source'});
globalMin = table(candX(imin), candY(imin), fmin, string(srcMin), ...
    'VariableNames', {'x','y','f','source'});

% -------------------- plot --------------------
axh = [];
if doPlot
    axh = gca; cla(axh); % Live Script friendly: reuse current axes
    pal = getPalette_();
    Nx = gridSize(1); Ny = gridSize(2);
    xv = linspace(ax, bx, Nx); yv = linspace(ay, by, Ny);
    [Xg, Yg] = meshgrid(xv, yv);
    Zg = eval_sym_safe(fs, x, y, Xg, Yg);
    ZgPlot = Zg;
    ZgPlot(~isfinite(ZgPlot)) = NaN;
    if ~isreal(ZgPlot), ZgPlot = real(ZgPlot); end

    hSurf = surf(axh, Xg, Yg, ZgPlot, 'EdgeColor','none'); %#ok<NASGU>
    colormap(axh, parula); shading(axh,'interp');
    hold(axh,'on'); grid(axh,'on'); axis(axh,'tight');
    camlight(axh,'headlight'); lighting(axh,'gouraud');
    view(axh, 40, 30);
    xlabel(axh,'x'); ylabel(axh,'y'); zlabel(axh,'f(x,y)');
    title(axh, 'Surface with classified critical points');

    % Marker styles
    mk = struct( ...
        'max',    struct('m','o','c',pal.vermillion), ...
        'min',    struct('m','s','c',pal.green), ...
        'saddle', struct('m','^','c',pal.blue), ...
        'edge',   struct('m','d','c',pal.gray5), ...
        'corner', struct('m','p','c',pal.black), ...
        'incon',  struct('m','d','c',pal.gray6) );

    hKeep = gobjects(0);

    % Batch evaluate all Z values once
    allX = [intTab.x; edgeTab.x; cornTab.x];
    allY = [intTab.y; edgeTab.y; cornTab.y];
    allZ = eval_sym_safe(fs, x, y, allX, allY);
    nInt = height(intTab);
    nEdge = height(edgeTab);
    Zint = allZ(1:nInt);
    Zedge = allZ(nInt+1:nInt+nEdge);
    Zcorn = allZ(nInt+nEdge+1:end);

    % Interior classes
    hKeep = [hKeep; plot_class_with_z(axh, intTab, Zint, "local max", mk.max)];
    hKeep = [hKeep; plot_class_with_z(axh, intTab, Zint, "local min", mk.min)];
    hKeep = [hKeep; plot_class_with_z(axh, intTab, Zint, "saddle",    mk.saddle)];
    hKeep = [hKeep; plot_class_with_z(axh, intTab, Zint, "inconclusive", mk.incon)];

    % Edge crits
    if ~isempty(edgeTab)
        h = scatter3(axh, edgeTab.x, edgeTab.y, Zedge, 36, ...
            'filled', mk.edge.m, ...
            'MarkerFaceColor', mk.edge.c, 'MarkerEdgeColor','k', ...
            'DisplayName', 'edge crits');
        hKeep(end+1) = h;
    end

    % Corners
    h = scatter3(axh, cornTab.x, cornTab.y, Zcorn, 44, ...
        'filled', mk.corner.m, ...
        'MarkerFaceColor', mk.corner.c, 'MarkerEdgeColor','k', ...
        'DisplayName', 'corners');
    hKeep(end+1) = h;

    % Legend with markers only (surface hidden by default)
    lgd = legend(axh, hKeep(isgraphics(hKeep)), 'Location','northeastoutside');
    set(lgd,'AutoUpdate','off');
end

% -------------------- optional printed analysis --------------------
if showAnalysis
    fprintf('\n=== Interior critical points ===\n');
    disp(intTab);
    fprintf('\n=== Edge critical points and endpoints ===\n');
    disp(edgeTab);
    fprintf('\n=== Corners ===\n');
    disp(cornTab);
    fprintf('\n=== Global extrema on the rectangle ===\n');
    fprintf('Global MAX: x=%.6g, y=%.6g, f=%.6g  [%s]\n', ...
        globalMax.x, globalMax.y, globalMax.f, globalMax.source);
    fprintf('Global MIN: x=%.6g, y=%.6g, f=%.6g  [%s]\n', ...
        globalMin.x, globalMin.y, globalMin.f, globalMin.source);
end

% -------------------- pack output --------------------
out = struct('interior',intTab, 'edges',edgeTab, 'corners',cornTab, ...
             'globalMax',globalMax, 'globalMin',globalMin, ...
             'axes',axh, 'domain',[ax bx; ay by]);
end

% ========================== helpers ==========================
function r = range_(v)
if isempty(v), r = 0; else, r = max(v)-min(v); end
end

function val = safe_double(sx)
try
    val = double(sx);
    if ~isscalar(val) || ~isfinite(val), val = NaN; end
catch
    val = NaN;
end
end

function cls = classify_hessian(D, fxxv)
if D > 0 && fxxv > 0
    cls = "local min";
elseif D > 0 && fxxv < 0
    cls = "local max";
elseif D < 0
    cls = "saddle";
else
    cls = "inconclusive";
end
end

function Z = eval_sym_safe(fsym, x, y, X, Y)
% Robust evaluator for scalars, vectors, meshgrids.
persistent funCache
if isempty(funCache)
    funCache = containers.Map('KeyType','char','ValueType','any');
end
key = char(fsym);
if funCache.isKey(key)
    ffun = funCache(key);
else
    % Avoid 'Optimize', it can error in anonymous-function mode
    ffun = matlabFunction(fsym, 'Vars', [x y]);
    funCache(key) = ffun;
end
try
    Z = ffun(X, Y);
    Z = double(Z);
catch
    % Last resort: elementwise
    Z = arrayfun(@(a,b) safe_double(subs(fsym,[x y],[a b])), X, Y);
end
end

function [Xo, Yo] = dedup2D(X, Y, tol)
if isempty(X), Xo=[]; Yo=[]; return; end
[~, idx] = uniquetol([X(:) Y(:)], tol, 'ByRows', true, 'DataScale', 1);
Xo = X(idx); Yo = Y(idx);
end

function T = dedupRows(T)
if height(T) <= 1, return; end
[~, idx] = uniquetol([T.x T.y], 1e-12, 'ByRows', true, 'DataScale', 1);
T = T(idx,:);
end

function src = source_of(x0, y0, intTab, edgeTab, cornTab)
src = "unknown";
if any(abs(intTab.x - x0)<1e-12 & abs(intTab.y - y0)<1e-12)
    cls = intTab.class(abs(intTab.x - x0)<1e-12 & abs(intTab.y - y0)<1e-12);
    src = "interior (" + cls(1) + ")";
    return
end
if any(abs(edgeTab.x - x0)<1e-12 & abs(edgeTab.y - y0)<1e-12)
    where = edgeTab.where(abs(edgeTab.x - x0)<1e-12 & abs(edgeTab.y - y0)<1e-12);
    edge  = edgeTab.edge (abs(edgeTab.x - x0)<1e-12 & abs(edgeTab.y - y0)<1e-12);
    src = "edge " + edge(1) + " (" + where(1) + ")";
    return
end
if any(abs(cornTab.x - x0)<1e-12 & abs(cornTab.y - y0)<1e-12)
    src = "corner";
end
end

function T = analyze_edge_1d(fs, x, y, edgeName, uSym, u0, u1, otherSym, otherVal)
% Fix other variable, analyze g(u) on [u0,u1]
g   = subs(fs, otherSym, otherVal);
dg  = diff(g, uSym);
d2g = diff(g, uSym, 2);

Cu = [];
try
    Cu = solve(dg==0, uSym, 'Real', true, 'IgnoreAnalyticConstraints', true);
    Cu = double(Cu);
    good = isfinite(Cu) & Cu>=u0 & Cu<=u1;
    Cu = unique(Cu(good));
catch
    Cu = [];
end

T = table([],[],[],[],[],[],'VariableNames',{'x','y','f','edge','where','class'});

for ui = Cu(:).'
    if isequal(uSym, x), xx = ui; yy = double(otherVal);
    else,                 xx = double(otherVal); yy = ui; end
    fv  = eval_sym_safe(fs, x, y, xx, yy);
    d2v = safe_double(subs(d2g, uSym, ui));
    if d2v > 0
        cls = "edge min";
    elseif d2v < 0
        cls = "edge max";
    else
        cls = "edge inconclusive";
    end
    T = [T; {xx, yy, fv, string(edgeName), "interior", cls}]; %#ok<AGROW>
end

% Endpoints on this edge
for ui = [u0 u1]
    if isequal(uSym, x), xx = ui; yy = double(otherVal);
    else,                 xx = double(otherVal); yy = ui; end
    fv = eval_sym_safe(fs, x, y, xx, yy);
    T = [T; {xx, yy, fv, string(edgeName), "endpoint", "endpoint"}]; %#ok<AGROW>
end
end

function h = plot_class_with_z(axh, T, Z, label, sty)
idx = strcmp(T.class, label);
if ~any(idx), h = gobjects(0); return; end
h = scatter3(axh, T.x(idx), T.y(idx), Z(idx), 60, ...
    'filled', sty.m, ...
    'MarkerFaceColor', sty.c, 'MarkerEdgeColor','k', ...
    'DisplayName', label);
end

function pal = getPalette_()
% Okabe–Ito + neutrals (RGB in [0,1])
base = [ ...
    0   0   0  ;   % black
    230 159   0;   % orange
    86  180 233;   % sky blue
    0   158 115;   % bluish green
    240 228  66;   % yellow
    0   114 178;   % blue
    213  94   0;   % vermillion
    204 121 167]/255; % reddish purple
pal.black      = base(1,:);
pal.orange     = base(2,:);
pal.sky        = base(3,:);
pal.green      = base(4,:);
pal.yellow     = base(5,:);
pal.blue       = base(6,:);
pal.vermillion = base(7,:);
pal.purple     = base(8,:);
pal.gray3      = 0.30*[1 1 1];
pal.gray5      = 0.50*[1 1 1];
pal.gray6      = 0.60*[1 1 1];
end
