module.exports = {
  title: 'Angular Material, CDK & Accessibility',
  slug: 'material-cdk',
  order: 11,
  topics: [
    {
      title: 'Angular Material Basics',
      slug: 'angular-material-basics',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Almost every real Angular application ships a component library, and Angular Material is the one the framework team itself builds and maintains. It gives you buttons, form fields, dialogs, menus, tables, date pickers and dozens more — all keyboard-accessible, screen-reader-aware, themable, and RTL-ready out of the box. When an interviewer asks "how would you build a data-heavy admin screen this afternoon?", the expected answer is not "hand-roll a dropdown with a <code>div</code> and a <code>mousedown</code> listener" — it is "compose Material components on top of the CDK." Knowing Material well is the difference between shipping an accessible product in a day and reinventing focus management, positioning and ARIA wiring badly over a week.</p>`,
        `<p>Material also teaches a mental model that shows up everywhere else: the split between the <strong>CDK</strong> (Component Dev Kit — unstyled behaviour primitives like Overlay, a11y, drag-drop, virtual scroll) and <strong>Material</strong> (opinionated, Material-3-styled components built on top of the CDK). Interviewers love probing whether a candidate understands that Material is "just" a themed skin over reusable behaviour, because that understanding is exactly what lets you build a bespoke design system without giving up accessibility. Getting the basics right — standalone imports, the <code>mat-form-field</code> contract, tree-shaking — is the foundation for the theming, overlay and virtual-scroll topics that follow.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>Angular Material is a set of standalone components you import <em>per component</em> and drop into your template. Since Angular v15+ every Material component is standalone, so you no longer import a giant <code>MatXxxModule</code> into an NgModule — you add the specific module (or the standalone component) to a component's <code>imports</code> array. You style them all at once by defining a theme in your global stylesheet (covered in the next topic), and each component reads that theme through CSS custom properties.</p>`,
        `{{fig:ch12-material-anatomy.svg|Flow from a standalone import through the Material component down to CDK primitives and theme tokens|Import per component for tree-shaking, theme once at the root, and every Material component reads the shared design tokens.}}`,
        `<p>The most important building block to understand first is <code>mat-form-field</code>. It is not an input — it is a <em>wrapper</em> that coordinates a label, the actual control (a <code>matInput</code>, <code>mat-select</code>, etc.), hint text and error messages, and wires up all the ARIA relationships between them. Nearly every form-related interview question about Material comes back to "what does <code>mat-form-field</code> actually do, and why does the input need the <code>matInput</code> directive?"</p>`,
        `{{fig:ch12-form-field.svg|The parts of mat-form-field: label, control, hint and error and the ARIA wiring between them|mat-form-field is a coordinator that manages the floating label, the control directive, hints, errors and their aria-describedby relationships.}}`,
        `<table>`,
        `<thead><tr><th>Layer</th><th>What it is</th><th>Example</th></tr></thead>`,
        `<tbody>`,
        `<tr><td>CDK</td><td>Unstyled behaviour primitives</td><td>Overlay, a11y, DragDrop, Scrolling</td></tr>`,
        `<tr><td>Material</td><td>Styled components on the CDK</td><td>MatButton, MatDialog, MatMenu</td></tr>`,
        `<tr><td>Theme</td><td>Design tokens (CSS vars)</td><td>--mat-sys-primary</td></tr>`,
        `<tr><td>Your app</td><td>Composes the above</td><td>imports: [MatButtonModule]</td></tr>`,
        `</tbody></table>`,

        `<h2>How it works</h2>`,
        `<p><strong>Standalone imports and tree-shaking.</strong> Each Material feature ships as a small standalone module (<code>MatButtonModule</code>, <code>MatInputModule</code>, <code>MatFormFieldModule</code>, …). You add exactly the ones a component uses to its <code>imports</code>. Because you never pull in one monolithic module, the bundler can tree-shake everything you don't reference. This is why "import <code>MatFormFieldModule</code> globally in a shared module and re-export it" is an anti-pattern in a standalone codebase — it defeats per-component analysis and bloats every lazy chunk that touches the shared module.</p>`,
        `<p><strong>The mat-form-field contract.</strong> A form field expects exactly one control that implements the <code>MatFormFieldControl</code> interface. <code>matInput</code>, <code>mat-select</code>, <code>mat-chip-grid</code> and the date-picker input all implement it. That interface is how the field knows the control's <em>value, placeholder, focused, empty, disabled, required</em> and <em>error</em> state, which in turn drives the floating label animation and error display. When you build a <em>custom</em> form control you implement <code>MatFormFieldControl</code> (plus <code>ControlValueAccessor</code>) so it slots into a <code>mat-form-field</code> like a native input — a favourite senior interview exercise.</p>`,
        `<p><strong>Label floating.</strong> The field observes the control's <code>empty</code> and <code>focused</code> streams. When the control is focused or non-empty, the label translates up and shrinks; when blurred and empty it drops back into the field. That animation is pure CSS driven by state classes the field toggles — no JavaScript layout thrash.</p>`,
        `<p><strong>Errors and hints.</strong> <code>mat-error</code> is only rendered when the control is invalid <em>and</em> in an error state, which by default means "invalid and touched or its form submitted" (the <code>ErrorStateMatcher</code>). You can swap the matcher to show errors eagerly. Both <code>mat-hint</code> and <code>mat-error</code> are linked to the control via <code>aria-describedby</code>, so a screen reader announces them — accessibility you get for free by using the wrapper instead of laying out labels by hand.</p>`,
        `<p><strong>Density and appearance.</strong> <code>appearance</code> switches between <code>fill</code> (default) and <code>outline</code>. Global density (from the theme) tightens vertical rhythm for data-dense UIs. Because these are token-driven, changing them does not require touching each field's markup.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. A minimal standalone component using a button and an input.</strong> Note the per-component imports.</p>`,
        `<pre><code class="language-typescript">import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [MatButtonModule, MatInputModule, MatFormFieldModule, FormsModule],
  template: \`
    &lt;mat-form-field appearance="outline"&gt;
      &lt;mat-label&gt;Email&lt;/mat-label&gt;
      &lt;input matInput type="email" [(ngModel)]="email" required /&gt;
      &lt;mat-hint&gt;We never share it.&lt;/mat-hint&gt;
    &lt;/mat-form-field&gt;
    &lt;button mat-flat-button color="primary" (click)="submit()"&gt;Sign up&lt;/button&gt;
  \`,
})
export class SignupComponent {
  email = '';
  submit() { /* ... */ }
}</code></pre>`,
        `<p><strong>2. Reactive form with error display.</strong> The <code>mat-error</code> appears only once the control is in an error state.</p>`,
        `<pre><code class="language-typescript">import { Component } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-email-field',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  template: \`
    &lt;mat-form-field&gt;
      &lt;mat-label&gt;Email&lt;/mat-label&gt;
      &lt;input matInput [formControl]="email" /&gt;
      &#64;if (email.hasError('required')) {
        &lt;mat-error&gt;Email is required&lt;/mat-error&gt;
      }
      &#64;if (email.hasError('email')) {
        &lt;mat-error&gt;Not a valid email&lt;/mat-error&gt;
      }
    &lt;/mat-form-field&gt;
  \`,
})
export class EmailFieldComponent {
  email = new FormControl('', [Validators.required, Validators.email]);
}</code></pre>`,
        `<p><strong>3. Opening a dialog — a component rendered in an overlay.</strong> This previews the CDK Overlay topic.</p>`,
        `<pre><code class="language-typescript">import { Component, inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialog } from './confirm-dialog';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: \`&lt;button mat-button (click)="confirm()"&gt;Delete&lt;/button&gt;\`,
})
export class ToolbarComponent {
  private dialog = inject(MatDialog);
  confirm() {
    const ref = this.dialog.open(ConfirmDialog, { data: { name: 'invoice #42' } });
    ref.afterClosed().subscribe(ok =&gt; { if (ok) { /* delete */ } });
  }
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Forgetting the <code>matInput</code> directive.</strong> A bare <code>&lt;input&gt;</code> inside <code>mat-form-field</code> throws "mat-form-field must contain a MatFormFieldControl". The directive is what implements the control contract.</li>`,
        `<li><strong>Skipping <code>BrowserAnimationsModule</code> / <code>provideAnimations()</code>.</strong> Without it, ripples and label animations silently break. Use <code>provideAnimationsAsync()</code> to lazy-load the animation engine.</li>`,
        `<li><strong>Re-exporting all Material modules from one shared module.</strong> Kills tree-shaking and bloats lazy chunks. Import per component instead.</li>`,
        `<li><strong>Styling Material internals with <code>::ng-deep</code>.</strong> Fragile against version bumps — Material's internal DOM changes. Prefer theme tokens and documented CSS custom properties.</li>`,
        `<li><strong>Putting multiple controls in one <code>mat-form-field</code>.</strong> It coordinates exactly one control; two inputs confuse the label and error wiring.</li>`,
        `<li><strong>Assuming Material is small.</strong> Each component adds weight; import only what you render and lazy-load heavy features like the date picker.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Import Material modules per standalone component</strong>, never through a giant barrel — keep the bundler's tree-shaking intact.</li>`,
        `<li><strong>Always wrap inputs in <code>mat-form-field</code></strong> so you inherit label, hint, error and ARIA wiring instead of re-implementing them.</li>`,
        `<li><strong>Use <code>provideAnimationsAsync()</code></strong> at the app config level to load the animation engine lazily.</li>`,
        `<li><strong>Reach for the CDK first when a Material component doesn't fit.</strong> Custom dropdown? Use CDK Overlay, not raw DOM — you keep positioning and accessibility.</li>`,
        `<li><strong>Prefer <code>color="primary"</code>/theme tokens over hard-coded colours</strong> so light/dark and rebrands "just work".</li>`,
        `<li><strong>Test with a keyboard and a screen reader.</strong> Material gives you a strong baseline, but custom compositions can still break focus order.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What is the difference between Angular Material and the CDK?</strong> The CDK (Component Dev Kit) is a set of <em>unstyled</em> behaviour primitives — Overlay, a11y, DragDrop, Scrolling, Portal, Table, Stepper logic. Material is a set of <em>Material-3-styled</em> components built on top of those primitives. You can build a bespoke design system directly on the CDK and skip Material's look entirely while keeping its accessibility.</p></blockquote>`,
        `<blockquote><p><strong>Q: What does <code>mat-form-field</code> actually do?</strong> It is a wrapper, not a control. It coordinates the floating label, the control (via the <code>MatFormFieldControl</code> interface), hint and error text, and the <code>aria-describedby</code> relationships between them. The input needs the <code>matInput</code> directive because that directive implements the control contract the field reads.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): Why does my label not float / ripple not animate?</strong> You almost certainly didn't provide the animations module. Add <code>provideAnimationsAsync()</code> (or <code>provideAnimations()</code>); without it Material's animation-driven behaviours degrade or break.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you keep a Material app's bundle small?</strong> Import each Material module only into the standalone components that use it (never one shared re-export barrel), lazy-load routes, and defer heavy features like the datepicker. Per-component imports let the bundler tree-shake unused components.</p></blockquote>`,
        `<blockquote><p><strong>Q: When would you build a custom <code>MatFormFieldControl</code>?</strong> When you need a bespoke input (a multi-part phone number, a colour picker) to sit inside a <code>mat-form-field</code> and get its label, hint, error and accessibility for free. You implement <code>MatFormFieldControl</code> plus <code>ControlValueAccessor</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): Is it fine to style Material internals with <code>::ng-deep</code>?</strong> It works but is brittle — Material's internal DOM and class names are not a public API and change between versions. Prefer overriding documented theme tokens / CSS custom properties.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>CDK</strong> = unstyled behaviour · <strong>Material</strong> = styled components on the CDK · <strong>theme</strong> = shared tokens.</li>`,
        `<li><strong>Imports:</strong> per standalone component (<code>imports: [MatButtonModule]</code>) — keeps tree-shaking.</li>`,
        `<li><strong>mat-form-field</strong> = coordinator for label + control + hint + error + ARIA. Needs <code>matInput</code> on the input.</li>`,
        `<li><strong>Animations:</strong> <code>provideAnimationsAsync()</code> or label/ripple break.</li>`,
        `<li><strong>appearance:</strong> <code>fill</code> (default) or <code>outline</code>; errors via <code>mat-error</code> + <code>ErrorStateMatcher</code>.</li>`,
        `<li><strong>Custom input?</strong> implement <code>MatFormFieldControl</code> + <code>ControlValueAccessor</code>.</li>`,
        `</ul>`,
      ].join('\n')
    },

    {
      title: 'Material 3 Theming',
      slug: 'material-theming',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Theming is where most teams either get enormous leverage from Material or fight it forever. Get it right and one <code>styles.scss</code> file drives every component's colour, typography and density across light and dark mode, and a rebrand is a two-line change. Get it wrong — hard-coded hex values, <code>::ng-deep</code> overrides, per-component Sass forks — and you end up with a design system nobody can safely change. Interviewers ask about theming precisely because it separates people who <em>use</em> Material from people who <em>own</em> a design system built on it.</p>`,
        `<p>The stakes rose with the move to <strong>Material 3</strong> (M3), the current design language, and its new token-based theming API (<code>mat.theme()</code>). M3 replaced the old three-map "define-a-palette, build-a-theme, apply-component-mixins" flow with a system of CSS custom properties (design tokens). Understanding that shift — why tokens beat compiled Sass, how dark mode becomes almost free, how to override a single token without touching a component's internals — is exactly the kind of "have you actually shipped this?" signal a senior interview is looking for.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>A Material 3 theme is a <em>configuration</em> — a colour palette, a typography scale, and a density level — that you pass to the <code>mat.theme()</code> Sass mixin. That mixin emits a large set of <strong>CSS custom properties</strong> (design tokens) like <code>--mat-sys-primary</code>, <code>--mat-sys-surface</code> and <code>--mat-sys-on-surface</code>. Every Material component is authored to read those tokens, so defining the theme once at the root styles the entire app.</p>`,
        `{{fig:ch12-theme-tokens.svg|Material 3 pipeline from a theme config through generated system tokens to components, with light and dark values|A theme config feeds mat.theme(), which emits CSS custom-property tokens that every Material component reads; light and dark share the same tokens with different values.}}`,
        `<p>The mental model: you no longer "compile a theme into each component's styles." You publish a set of <em>variables</em>, and the components subscribe to them at runtime. Because they are plain CSS custom properties, dark mode is just "the same tokens with different values inside a <code>color-scheme: dark</code> context," and overriding one colour is a single CSS variable assignment — no Sass recompilation, no digging into component internals.</p>`,

        `<h2>How it works</h2>`,
        `<p><strong>Palettes.</strong> M3 palettes are tonal — a single seed colour expands into a tonal range (0–100 lightness steps). Material ships prebuilt palettes (<code>mat.$azure-palette</code>, <code>mat.$violet-palette</code>, …) and a generator schematic (<code>ng generate @angular/material:theme-color</code>) that produces a custom palette Sass map from your brand colours. The palette supplies the <em>primary</em>, <em>secondary</em>, <em>tertiary</em>, <em>neutral</em> and <em>error</em> roles that the token set is derived from.</p>`,
        `<p><strong>mat.theme().</strong> You call the mixin inside a selector (usually <code>:root</code> or <code>html</code>) with a config map: <code>color</code> (the theme type + palette), <code>typography</code> (a brand font and optionally a full type scale), and <code>density</code> (0 default; negative values tighten spacing). The mixin outputs the system tokens for that configuration. One call configures colour, type and density together.</p>`,
        `<pre><code class="language-scss">@use '@angular/material' as mat;

html {
  @include mat.theme((
    color: (
      theme-type: light,
      primary: mat.$violet-palette,
      tertiary: mat.$cyan-palette,
    ),
    typography: Roboto,
    density: 0,
  ));
}</code></pre>`,
        `<p><strong>Dark mode.</strong> The modern approach uses the CSS <code>color-scheme</code> property. Set <code>theme-type: light dark</code> (or provide a light and a dark call scoped to a selector/class) and the tokens resolve to the appropriate values based on <code>color-scheme</code>. You can wire this to the OS preference (<code>prefers-color-scheme</code>) or to a manual toggle by stamping a class/attribute on the root and scoping a second <code>mat.theme()</code> call to it. Because components read tokens, nothing in component templates changes when the theme flips.</p>`,
        `<p><strong>Typography.</strong> M3 exposes a type scale (display, headline, title, body, label — each in large/medium/small). You can pass a single brand font, or a full config that overrides the scale's families, weights and sizes. Components map their text to scale roles, so setting the scale restyles headings, buttons and labels consistently. The <code>mat.typography-hierarchy()</code> mixin can also emit ready-made CSS classes (<code>.mat-headline-large</code>, …) for your own markup.</p>`,
        `<p><strong>System tokens vs component tokens.</strong> M3 tokens come in two layers. <em>System</em> tokens (<code>--mat-sys-*</code>) are the app-wide palette, typography and shape values that <code>mat.theme()</code> emits — the vocabulary the whole design system shares. <em>Component</em> tokens are per-component variables that <em>default</em> to system tokens but can be retargeted individually through each component's <code>-overrides</code> mixin. Understanding this two-tier model is what lets you say "change the app's primary colour" (a system token) versus "make only the FAB a different shade" (a component token) without fighting specificity.</p>`,
        `<p><strong>Overriding a single token.</strong> Because tokens are CSS variables, you can override one component's look with the component-specific <em>overrides</em> mixins (e.g. <code>mat.button-overrides(( container-color: ... ))</code>) or by setting the CSS variable in a scoped selector. This is the sanctioned replacement for <code>::ng-deep</code>: you change a documented token, not a component's private DOM. Because the override is just a CSS variable set in a selector, normal cascade and scoping rules apply — put it on a wrapper class and only that subtree is affected, with no <code>!important</code> arms race against Material's own styles.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. A theme with system dark mode.</strong> One call handles both schemes.</p>`,
        `<pre><code class="language-scss">@use '@angular/material' as mat;

html {
  color-scheme: light dark;              // honour OS preference
  @include mat.theme((
    color: (
      theme-type: light dark,            // emit both light and dark tokens
      primary: mat.$azure-palette,
    ),
    typography: Roboto,
    density: 0,
  ));
}</code></pre>`,
        `<p><strong>2. A manual light/dark toggle.</strong> Scope a dark theme to a class the app stamps on <code>&lt;html&gt;</code>.</p>`,
        `<pre><code class="language-scss">@use '@angular/material' as mat;

html {
  @include mat.theme((color: (theme-type: light, primary: mat.$violet-palette)));
}
html.dark {
  color-scheme: dark;
  @include mat.theme((color: (theme-type: dark, primary: mat.$violet-palette)));
}</code></pre>`,
        `<pre><code class="language-typescript">// toggle component
import { Component, inject, DOCUMENT } from '@angular/core';

@Component({ selector: 'app-theme-toggle', standalone: true, template: \`
  &lt;button (click)="toggle()"&gt;Toggle theme&lt;/button&gt;\` })
export class ThemeToggle {
  private doc = inject(DOCUMENT);
  toggle() { this.doc.documentElement.classList.toggle('dark'); }
}</code></pre>`,
        `<p><strong>3. Overriding one component's tokens without <code>::ng-deep</code>.</strong></p>`,
        `<pre><code class="language-scss">@use '@angular/material' as mat;

.cta {
  // only affects buttons inside .cta — documented tokens, version-safe
  @include mat.button-overrides((
    filled-container-color: var(--brand-accent),
    filled-label-text-color: white,
  ));
}</code></pre>`,
        `<p><strong>4. Emitting the M3 type scale as utility classes.</strong></p>`,
        `<pre><code class="language-scss">@use '@angular/material' as mat;
html { @include mat.typography-hierarchy(); } // .mat-headline-large, .mat-body-medium, ...</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Hard-coding hex colours in component CSS.</strong> They ignore the theme and break in dark mode. Reference tokens (<code>var(--mat-sys-primary)</code>) instead.</li>`,
        `<li><strong>Calling <code>mat.theme()</code> in many component stylesheets.</strong> It should be emitted once at the root; repeating it duplicates tokens and bloats CSS.</li>`,
        `<li><strong>Reaching for <code>::ng-deep</code> to restyle a component.</strong> Use the component <code>-overrides</code> mixins or token variables — the supported, version-safe path.</li>`,
        `<li><strong>Confusing M2 and M3 APIs.</strong> The old <code>mat.define-light-theme()</code> / <code>mat.all-component-themes()</code> flow is M2. M3 uses <code>mat.theme()</code> and tokens; mixing the two produces confusing output.</li>`,
        `<li><strong>Forgetting <code>color-scheme</code> for dark mode.</strong> Without it, native form controls, scrollbars and the token resolution don't switch cleanly.</li>`,
        `<li><strong>Overriding at too broad a scope.</strong> A token change on <code>:root</code> hits every instance; scope overrides to a class when you mean "just these buttons."</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Define the theme once at the root</strong> and let every component inherit tokens — treat <code>styles.scss</code> as the single source of truth.</li>`,
        `<li><strong>Generate a custom palette from brand colours</strong> with the <code>theme-color</code> schematic rather than eyeballing tonal steps.</li>`,
        `<li><strong>Drive dark mode with <code>color-scheme</code></strong> and <code>theme-type: light dark</code> (or a scoped class) so nothing in templates changes on toggle.</li>`,
        `<li><strong>Prefer <code>-overrides</code> mixins and token variables</strong> over deep selectors for local customisation.</li>`,
        `<li><strong>Use the M3 type scale roles</strong> consistently instead of ad-hoc font sizes so headings and labels stay in rhythm.</li>`,
        `<li><strong>Keep density deliberate</strong> — tighten it for data tables, leave it default for touch-first screens.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: How does Material 3 theming differ from Material 2?</strong> M2 compiled a theme (from <code>define-light-theme()</code>) into every component's CSS via component-theme mixins. M3 emits <em>design tokens</em> — CSS custom properties like <code>--mat-sys-primary</code> — from a single <code>mat.theme()</code> call, and components read those tokens at runtime. Tokens make overrides and dark mode far cheaper.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you implement dark mode?</strong> Set <code>color-scheme</code> and use <code>theme-type: light dark</code> to emit both token sets, or scope a second <code>mat.theme()</code> call to a <code>.dark</code> class you toggle on the root. Because components read tokens, no template changes are needed — only the token values differ.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): A designer wants only the primary buttons in the CTA a different colour. How, without <code>::ng-deep</code>?</strong> Scope <code>mat.button-overrides()</code> (or set the relevant CSS token variables) inside a <code>.cta</code> selector. That changes documented tokens for that subtree only and survives version bumps, unlike deep selectors into Material's private DOM.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is a palette in M3?</strong> A tonal palette — a seed colour expanded into a 0–100 lightness range that supplies primary/secondary/tertiary/neutral/error roles. Material ships prebuilt ones and a generator to build a custom palette map from brand colours.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why prefer tokens over hard-coded colours in your own components?</strong> Tokens automatically respond to theme, density and dark mode, and keep your UI consistent with Material's. Hard-coded hex values drift out of the system and break the instant the theme or scheme changes.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): Where should <code>mat.theme()</code> be called?</strong> Once, at the root (<code>html</code>/<code>:root</code>) in the global stylesheet. Calling it inside component styles duplicates the whole token set per component and bloats the bundle.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>M3 theme</strong> = config (color palette + typography + density) → <code>mat.theme()</code> → CSS token vars.</li>`,
        `<li><strong>Tokens:</strong> <code>--mat-sys-primary</code>, <code>--mat-sys-surface</code>, <code>--mat-sys-on-surface</code> — components read them.</li>`,
        `<li><strong>Dark mode:</strong> <code>color-scheme</code> + <code>theme-type: light dark</code> or a scoped <code>.dark</code> theme call.</li>`,
        `<li><strong>Local override:</strong> <code>mat.button-overrides()</code> / token vars — NOT <code>::ng-deep</code>.</li>`,
        `<li><strong>Define once</strong> at the root; palettes are tonal; use the <code>theme-color</code> schematic for brand colours.</li>`,
        `<li><strong>M2 vs M3:</strong> compiled Sass theme (M2) → runtime tokens (M3).</li>`,
        `</ul>`,
      ].join('\n')
    },

    {
      title: 'CDK Overlay & Portal',
      slug: 'cdk-overlay-portal',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Every menu, tooltip, dialog, autocomplete panel, snackbar and custom dropdown in Angular Material is built on two CDK primitives: <strong>Overlay</strong> and <strong>Portal</strong>. If you have ever tried to build a dropdown that appears above everything, isn't clipped by a parent's <code>overflow: hidden</code>, repositions when it would fall off screen, and closes when you click the backdrop — you have discovered exactly why these exist. The CDK Overlay solves the whole class of "floating UI" problems once, accessibly, and Material reuses it everywhere.</p>`,
        `<p>This is a favourite senior interview area because it exposes real DOM understanding: stacking contexts, why <code>position: absolute</code> inside a scrolling container fails, how to position one element relative to another as the page scrolls, and how Angular renders a component into a DOM node that lives outside the component tree. Candidates who can explain "attach a portal into an overlay positioned by a connected strategy with a backdrop" have almost certainly built non-trivial UI. Those who reach for <code>z-index: 9999</code> and a hand-rolled click-outside listener have not.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>An <strong>Overlay</strong> is a floating panel that the CDK renders into a container appended to <code>document.body</code> (the <code>cdk-overlay-container</code>), so it sits above your entire app and can't be clipped by an ancestor's overflow, z-index or transform. A <strong>Portal</strong> is a piece of UI — a component or an <code>&lt;ng-template&gt;</code> — that you can "teleport" and render into a different location (an <em>outlet</em>) such as that overlay. You create an overlay, then <em>attach</em> a portal to it; to close, you <em>detach</em> or <em>dispose</em>.</p>`,
        `{{fig:ch12-overlay-portal.svg|A portal in the component tree being attached into the cdk-overlay-container appended to body, above a backdrop|A portal (component or template) is attached into the overlay pane in the body-level overlay container, rendered above a backdrop and positioned by a strategy — escaping any ancestor clipping.}}`,
        `<p>The key separation: <strong>Portal = what to render and where the content comes from</strong>; <strong>Overlay = the floating container, its position, backdrop and scroll behaviour</strong>. Material's <code>MatMenu</code>, <code>MatDialog</code>, <code>MatTooltip</code> and autocomplete are all "attach this portal into an overlay configured like so."</p>`,

        `<h2>How it works</h2>`,
        `<p><strong>Creating an overlay.</strong> You inject <code>Overlay</code> and call <code>overlay.create(config)</code>, which returns an <code>OverlayRef</code> — a handle to the floating pane. The config includes a <code>positionStrategy</code>, a <code>scrollStrategy</code>, <code>hasBackdrop</code>, backdrop class, panel class, and width/height. The <code>OverlayRef</code> is how you attach content, listen for backdrop clicks (<code>backdropClick()</code>), and tear the overlay down (<code>dispose()</code>).</p>`,
        `<p><strong>Position strategies.</strong> Two main strategies. <code>GlobalPositionStrategy</code> centres or pins the overlay to the viewport (used by dialogs — "centre me on screen"). <code>FlexibleConnectedPositionStrategy</code> connects the overlay to an <em>origin</em> element (a trigger) using position pairs: each pair maps an <code>originX/originY</code> point on the trigger to an <code>overlayX/overlayY</code> point on the panel. You supply an ordered list via <code>withPositions([...])</code>; the strategy tries each and uses the first that fits in the viewport, so the panel flips sides near an edge instead of overflowing.</p>`,
        `{{fig:ch12-position-strategy.svg|A trigger origin point connected to an overlay point on the panel, with a fallback list that flips near the viewport edge|The flexible connected strategy joins an origin point on the trigger to an overlay point on the panel, and walks an ordered fallback list, flipping when a position would overflow.}}`,
        `<p><strong>withPush and withFlexibleDimensions.</strong> <code>withPush(true)</code> nudges the panel back on-screen if no position fully fits; <code>withFlexibleDimensions</code> lets the panel shrink to fit rather than overflow. Together they keep a menu usable in tight viewports.</p>`,
        `<p><strong>Scroll strategies.</strong> When the page scrolls while an overlay is open you pick a behaviour: <code>reposition()</code> (default for connected — follow the trigger), <code>close()</code> (dismiss on scroll — common for menus), <code>block()</code> (lock page scroll — used by dialogs), or <code>noop()</code>. This is set in the config's <code>scrollStrategy</code>.</p>`,
        `<p><strong>Portals and attachment.</strong> A <code>ComponentPortal</code> wraps a component class; a <code>TemplatePortal</code> wraps an <code>&lt;ng-template&gt;</code> plus its <code>ViewContainerRef</code> so it keeps its embedding context and injector; a <code>DomPortal</code> wraps an existing DOM node. You attach with <code>overlayRef.attach(portal)</code>, which instantiates the content and inserts it into the overlay pane, and remove with <code>overlayRef.detach()</code>. Because a <code>TemplatePortal</code> carries its origin injector, dependency injection and template context still work even though the DOM lives at body level — a subtle but important detail.</p>`,
        `<p><strong>Backdrop.</strong> With <code>hasBackdrop: true</code> the CDK renders a full-screen scrim behind the panel; <code>backdropClick()</code> emits when it's clicked so you can close the overlay. The backdrop also blocks interaction with the rest of the page, which is what makes modal dialogs modal.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. A connected overlay dropdown from a component portal.</strong></p>`,
        `<pre><code class="language-typescript">import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { MenuPanel } from './menu-panel';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [OverlayModule],
  template: \`&lt;button #trigger (click)="open()"&gt;Options&lt;/button&gt;\`,
})
export class DropdownComponent {
  private overlay = inject(Overlay);
  trigger = viewChild.required&lt;ElementRef&gt;('trigger');

  open() {
    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(this.trigger())
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
      ])
      .withPush(true);

    const ref = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
    ref.attach(new ComponentPortal(MenuPanel));
    ref.backdropClick().subscribe(() =&gt; ref.dispose());
  }
}</code></pre>`,
        `<p><strong>2. A template portal — keeps its injection context.</strong></p>`,
        `<pre><code class="language-typescript">import { Component, TemplateRef, ViewContainerRef, inject, viewChild } from '@angular/core';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

@Component({
  selector: 'app-tpl-overlay',
  standalone: true,
  imports: [OverlayModule],
  template: \`
    &lt;button (click)="open()"&gt;Show&lt;/button&gt;
    &lt;ng-template #tpl&gt;&lt;div class="card"&gt;Rendered in the overlay&lt;/div&gt;&lt;/ng-template&gt;
  \`,
})
export class TplOverlayComponent {
  private overlay = inject(Overlay);
  private vcr = inject(ViewContainerRef);
  tpl = viewChild.required&lt;TemplateRef&lt;unknown&gt;&gt;('tpl');

  open() {
    const ref = this.overlay.create({
      positionStrategy: this.overlay.position().global().centerHorizontally().top('40px'),
      hasBackdrop: true,
    });
    ref.attach(new TemplatePortal(this.tpl(), this.vcr));
    ref.backdropClick().subscribe(() =&gt; ref.detach());
  }
}</code></pre>`,
        `<p><strong>3. Declarative overlay with the <code>cdkConnectedOverlay</code> directive.</strong> No imperative code.</p>`,
        `<pre><code class="language-typescript">import { Component } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';

@Component({
  selector: 'app-declarative',
  standalone: true,
  imports: [OverlayModule],
  template: \`
    &lt;button #btn="cdkOverlayOrigin" cdkOverlayOrigin (click)="isOpen = !isOpen"&gt;Menu&lt;/button&gt;
    &lt;ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="btn"
      [cdkConnectedOverlayOpen]="isOpen"
      [cdkConnectedOverlayHasBackdrop]="true"
      (backdropClick)="isOpen = false"&gt;
      &lt;ul class="menu"&gt;&lt;li&gt;Edit&lt;/li&gt;&lt;li&gt;Delete&lt;/li&gt;&lt;/ul&gt;
    &lt;/ng-template&gt;
  \`,
})
export class DeclarativeOverlayComponent { isOpen = false; }</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Never disposing the <code>OverlayRef</code>.</strong> An overlay is a leak if you drop the reference — its DOM and subscriptions live on. Call <code>dispose()</code> when done (or on component destroy).</li>`,
        `<li><strong>Reaching for raw <code>position: absolute</code> + <code>z-index</code> instead of the overlay.</strong> It gets clipped by ancestor <code>overflow</code>/<code>transform</code> and won't reposition. The overlay exists to escape that.</li>`,
        `<li><strong>Using a <code>ComponentPortal</code> when you needed template context.</strong> A component portal has no access to the origin template's variables; use a <code>TemplatePortal</code> (which carries context and injector) when you need them.</li>`,
        `<li><strong>Forgetting a scroll strategy.</strong> A connected menu that neither repositions nor closes on scroll drifts away from its trigger. Pick <code>reposition()</code> or <code>close()</code> deliberately.</li>`,
        `<li><strong>No fallback positions.</strong> A single position pair overflows near a viewport edge. Provide an ordered list and/or <code>withPush(true)</code>.</li>`,
        `<li><strong>Missing focus management / ARIA on custom overlays.</strong> Material components trap focus and set roles for you; a hand-built overlay must add <code>cdkTrapFocus</code>, roles and escape handling itself (next topic).</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Prefer the declarative <code>cdkConnectedOverlay</code> directive</strong> for template-driven cases — it wires open/close, origin and backdrop with no manual <code>dispose()</code> bookkeeping.</li>`,
        `<li><strong>Always provide fallback positions plus <code>withPush</code></strong> so panels stay on-screen near edges.</li>`,
        `<li><strong>Choose a scroll strategy on purpose:</strong> <code>reposition</code> for menus that follow, <code>close</code> for dismiss-on-scroll, <code>block</code> for modals.</li>`,
        `<li><strong>Dispose overlays on destroy</strong> (or use <code>DestroyRef</code>/takeUntilDestroyed) to avoid leaked DOM and subscriptions.</li>`,
        `<li><strong>Layer accessibility on custom overlays</strong> — focus trap, <code>role</code>, <code>aria-modal</code>, Escape-to-close.</li>`,
        `<li><strong>Reuse Material components when they fit</strong> (MatMenu, MatDialog) rather than rebuilding overlay plumbing you'd have to make accessible yourself.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What problem does the CDK Overlay solve that <code>position: absolute</code> doesn't?</strong> The overlay renders into a container appended to <code>document.body</code>, so it escapes ancestor <code>overflow: hidden</code>, stacking contexts and transforms that would clip or mis-stack an absolutely-positioned element. It also brings position strategies, scroll strategies and a backdrop.</p></blockquote>`,
        `<blockquote><p><strong>Q: Difference between a Portal and an Overlay?</strong> A Portal is the <em>content</em> — a component, template, or DOM node — that can be rendered into an outlet elsewhere. An Overlay is the floating <em>container</em> (position, backdrop, scroll behaviour). You attach a portal into an overlay.</p></blockquote>`,
        `<blockquote><p><strong>Q: How does the connected position strategy decide where to place a panel?</strong> You give it an ordered list of position pairs (origin point on the trigger → overlay point on the panel). It uses the first pair that fits in the viewport, flipping to a fallback near an edge; <code>withPush</code> nudges it back on-screen if none fully fit.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): When would you use a <code>TemplatePortal</code> over a <code>ComponentPortal</code>?</strong> When the overlay content needs the surrounding template's context/variables or the origin component's injector. A <code>TemplatePortal</code> carries its <code>ViewContainerRef</code>, so DI and template context still work even though the DOM lives at body level; a <code>ComponentPortal</code> does not.</p></blockquote>`,
        `<blockquote><p><strong>Q: What scroll strategies exist and when do you use each?</strong> <code>reposition</code> (follow the trigger — menus), <code>close</code> (dismiss on scroll), <code>block</code> (lock page scroll — modals), <code>noop</code> (do nothing). Choosing wrong makes the panel drift or the page scroll behind a modal.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): Why is my custom overlay dropdown a memory leak?</strong> You created an <code>OverlayRef</code> but never called <code>dispose()</code>, so its DOM node and subscriptions persist. Dispose on close/destroy, or use the declarative <code>cdkConnectedOverlay</code> directive which manages lifecycle for you.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Overlay</strong> = floating container in a body-level <code>cdk-overlay-container</code> (escapes clipping). <strong>Portal</strong> = the content attached into it.</li>`,
        `<li><strong>Create:</strong> <code>overlay.create(config)</code> → <code>OverlayRef</code>; <code>ref.attach(portal)</code>; <code>ref.dispose()</code>.</li>`,
        `<li><strong>Portals:</strong> <code>ComponentPortal</code> · <code>TemplatePortal</code> (keeps context/injector) · <code>DomPortal</code>.</li>`,
        `<li><strong>Position:</strong> <code>global()</code> (dialogs) vs <code>flexibleConnectedTo()</code> + <code>withPositions([...])</code> + <code>withPush()</code>.</li>`,
        `<li><strong>Scroll strategy:</strong> reposition · close · block · noop.</li>`,
        `<li><strong>Declarative:</strong> <code>cdkConnectedOverlay</code> directive; always dispose imperative refs.</li>`,
        `</ul>`,
      ].join('\n')
    },

    {
      title: 'CDK Accessibility & Drag-Drop',
      slug: 'cdk-a11y-dragdrop',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Accessibility is not optional polish — it is a correctness and often a legal requirement, and it is the single hardest thing to bolt on after the fact. The CDK's <code>a11y</code> package gives you the low-level tools that make custom widgets usable with a keyboard and a screen reader: trapping focus inside a dialog, announcing dynamic changes politely, and knowing whether focus arrived by mouse or keyboard so you can show focus rings only when they help. Interviewers ask about this to see whether you treat accessibility as a first-class concern or an afterthought — and because implementing a focus trap correctly by hand is genuinely tricky.</p>`,
        `<p>Drag-and-drop is the other half of this topic because it is where accessibility and rich interaction collide. The CDK's <code>drag-drop</code> package gives you sortable lists, transfer between lists, drag handles, previews and placeholders — with pointer <em>and</em> the plumbing you need to keep it usable. A senior candidate is expected to know that the CDK moves the DOM for you but deliberately does <em>not</em> mutate your data model — you reorder your arrays in the drop handler. That single design decision is a common interview trap and a common production bug.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>The CDK <strong>a11y</strong> package has three headline tools. <code>cdkTrapFocus</code> (FocusTrap) keeps Tab/Shift+Tab cycling <em>inside</em> a region — essential for modals so keyboard users can't tab into the page behind. <code>LiveAnnouncer</code> pushes text into an ARIA live region so screen readers announce things that changed without a focus move ("Item added to cart"). <code>FocusMonitor</code> tells you how an element gained focus (mouse, keyboard, touch, programmatic), which powers "show focus outline only for keyboard users."</p>`,
        `{{fig:ch12-focus-trap.svg|A focus trap region with start and end anchors looping Tab focus back inside a dialog|cdkTrapFocus wraps a region with invisible tabbable anchors so Tab past the last control loops back to the first, keeping keyboard focus inside a modal.}}`,
        `<p>The CDK <strong>drag-drop</strong> package is built from <code>cdkDrag</code> (makes an element draggable) and <code>cdkDropList</code> (a container that sorts its <code>cdkDrag</code> children and can be connected to other lists). You listen to <code>(cdkDropListDropped)</code> and update your arrays with <code>moveItemInArray</code> (reorder within one list) or <code>transferArrayItem</code> (move between two lists).</p>`,
        `{{fig:ch12-dragdrop.svg|Two connected cdkDropList containers transferring a dragged item, with placeholder and preview|CdkDropList sorts its cdkDrag children and connects to other lists; on drop you call moveItemInArray or transferArrayItem to update your own data — the CDK never mutates it for you.}}`,

        `<h2>How it works</h2>`,
        `<p><strong>FocusTrap.</strong> <code>cdkTrapFocus</code> inserts two invisible, focusable anchor elements — one before and one after the region's content. When focus reaches the trailing anchor (you tabbed past the last real control) the trap redirects focus to the first element inside; Shift+Tab off the leading anchor sends it to the last. Add <code>cdkTrapFocusAutoCapture</code> to move focus into the region on open and restore it to the previously-focused element on close. This is exactly what makes a modal feel modal to a keyboard user. Note the trap governs Tab order — you still add <code>role="dialog"</code>, <code>aria-modal="true"</code> and an Escape handler yourself (Material's dialog does all of this for you).</p>`,
        `<p><strong>LiveAnnouncer.</strong> It maintains a visually-hidden <code>aria-live</code> region appended to the body. Calling <code>announce(message, politeness)</code> sets the region's text, prompting assistive tech to read it. <code>polite</code> waits for a pause; <code>assertive</code> interrupts. Use it for changes that have no natural focus target — a row deleted, a filter applied, an async save completed — where a sighted user sees a toast but a screen-reader user would otherwise hear nothing.</p>`,
        `<p><strong>FocusMonitor.</strong> It patches focus tracking to record the <em>origin</em> of focus and emits it as a stream, also stamping classes like <code>cdk-keyboard-focused</code> / <code>cdk-mouse-focused</code> on the element. That lets you style keyboard focus distinctly from mouse focus — the accessible version of "focus rings only when tabbing." It cleans up listeners when you <code>stopMonitoring</code> the element.</p>`,
        `<p><strong>Drag-drop mechanics.</strong> While dragging, the CDK creates a floating <em>preview</em> element that follows the pointer and leaves a <em>placeholder</em> in the list to show the drop position; the other items animate out of the way via transforms (no reflow of your data). Crucially, on drop the CDK <em>does not touch your array</em> — it fires <code>(cdkDropListDropped)</code> with <code>previousIndex</code>, <code>currentIndex</code>, and the source/target containers, and <em>you</em> mutate state. <code>moveItemInArray(arr, from, to)</code> handles same-list reordering; <code>transferArrayItem(fromArr, toArr, from, to)</code> moves across connected lists. Connect lists with <code>[cdkDropListConnectedTo]</code> (or wrap them in a <code>cdkDropListGroup</code>). You can restrict movement with <code>[cdkDragBoundary]</code>, lock an axis with <code>cdkDragLockAxis</code>, add a <code>cdkDragHandle</code>, or gate drops with a <code>[cdkDropListEnterPredicate]</code>.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. A focus-trapped panel with LiveAnnouncer.</strong></p>`,
        `<pre><code class="language-typescript">import { Component, inject } from '@angular/core';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [A11yModule],
  template: \`
    &lt;div cdkTrapFocus cdkTrapFocusAutoCapture role="dialog" aria-modal="true"&gt;
      &lt;h2&gt;Confirm&lt;/h2&gt;
      &lt;input placeholder="Reason" /&gt;
      &lt;button (click)="save()"&gt;Save&lt;/button&gt;
      &lt;button (click)="close()"&gt;Cancel&lt;/button&gt;
    &lt;/div&gt;
  \`,
})
export class ModalComponent {
  private announcer = inject(LiveAnnouncer);
  save() { this.announcer.announce('Changes saved', 'polite'); }
  close() { /* ... */ }
}</code></pre>`,
        `<p><strong>2. FocusMonitor to style keyboard focus only.</strong></p>`,
        `<pre><code class="language-typescript">import { Component, ElementRef, inject, viewChild, afterNextRender, DestroyRef } from '@angular/core';
import { FocusMonitor } from '@angular/cdk/a11y';

@Component({ selector: 'app-fancy-btn', standalone: true,
  template: \`&lt;button #btn&gt;Save&lt;/button&gt;\` })
export class FancyButton {
  private fm = inject(FocusMonitor);
  private destroyRef = inject(DestroyRef);
  btn = viewChild.required&lt;ElementRef&gt;('btn');
  constructor() {
    afterNextRender(() =&gt; {
      this.fm.monitor(this.btn()).subscribe(origin =&gt; {
        // origin: 'mouse' | 'keyboard' | 'touch' | 'program' | null
      });
      this.destroyRef.onDestroy(() =&gt; this.fm.stopMonitoring(this.btn()));
    });
  }
}</code></pre>`,
        `<p><strong>3. Two connected sortable lists — you update the data on drop.</strong></p>`,
        `<pre><code class="language-typescript">import { Component } from '@angular/core';
import {
  CdkDrag, CdkDropList, CdkDragDrop,
  moveItemInArray, transferArrayItem,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CdkDrag, CdkDropList],
  template: \`
    &lt;div cdkDropList #todo="cdkDropList" [cdkDropListData]="todoTasks"
         [cdkDropListConnectedTo]="[done]" (cdkDropListDropped)="drop($event)"&gt;
      &#64;for (t of todoTasks; track t) { &lt;div cdkDrag&gt;{{ t }}&lt;/div&gt; }
    &lt;/div&gt;
    &lt;div cdkDropList #done="cdkDropList" [cdkDropListData]="doneTasks"
         [cdkDropListConnectedTo]="[todo]" (cdkDropListDropped)="drop($event)"&gt;
      &#64;for (t of doneTasks; track t) { &lt;div cdkDrag&gt;{{ t }}&lt;/div&gt; }
    &lt;/div&gt;
  \`,
})
export class BoardComponent {
  todoTasks = ['Task A', 'Task C'];
  doneTasks = ['Task X'];
  drop(e: CdkDragDrop&lt;string[]&gt;) {
    if (e.previousContainer === e.container) {
      moveItemInArray(e.container.data, e.previousIndex, e.currentIndex);
    } else {
      transferArrayItem(e.previousContainer.data, e.container.data,
                        e.previousIndex, e.currentIndex);
    }
  }
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Expecting the CDK to mutate your data on drop.</strong> It does not — it moves the DOM and fires an event. If you forget <code>moveItemInArray</code>/<code>transferArrayItem</code>, the list snaps back on the next render.</li>`,
        `<li><strong>A focus trap without <code>role</code>/<code>aria-modal</code>/Escape.</strong> The trap only manages Tab order; you still owe the dialog semantics and a keyboard close.</li>`,
        `<li><strong>Announcing with <code>assertive</code> for routine changes.</strong> It interrupts whatever the screen reader is saying. Use <code>polite</code> unless it's urgent (an error).</li>`,
        `<li><strong>Not calling <code>stopMonitoring</code> on FocusMonitor.</strong> It attaches listeners; leaving them monitored leaks. Stop on destroy.</li>`,
        `<li><strong>Poor <code>track</code>/<code>trackBy</code> in drag lists.</strong> Without a stable identity the DOM is re-created on reorder, killing performance and animations.</li>`,
        `<li><strong>Forgetting to connect lists.</strong> Transfer between lists needs <code>cdkDropListConnectedTo</code> (or a <code>cdkDropListGroup</code>); otherwise items can't cross.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Trap focus in every modal/overlay</strong> with <code>cdkTrapFocus</code> + <code>AutoCapture</code>, and pair it with <code>role="dialog"</code>, <code>aria-modal</code> and Escape handling.</li>`,
        `<li><strong>Announce non-focus UI changes</strong> (deletes, filters, async results) via <code>LiveAnnouncer</code> — usually <code>polite</code>.</li>`,
        `<li><strong>Use <code>FocusMonitor</code> to distinguish keyboard from mouse focus</strong> instead of removing focus outlines outright.</li>`,
        `<li><strong>Always reorder your own arrays in <code>(cdkDropListDropped)</code></strong> with <code>moveItemInArray</code>/<code>transferArrayItem</code>; keep the model as the source of truth.</li>`,
        `<li><strong>Give drag lists stable <code>track</code> identities</strong> and use <code>cdkDragHandle</code> so drags don't hijack scroll or clicks.</li>`,
        `<li><strong>Test drag-drop and dialogs with a keyboard and screen reader</strong> — rich interactions are exactly where accessibility regressions hide.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What does <code>cdkTrapFocus</code> do, and what does it <em>not</em> do?</strong> It keeps Tab/Shift+Tab cycling inside a region using invisible anchor elements, and with <code>AutoCapture</code> moves focus in on open and restores it on close. It does <em>not</em> add dialog semantics — you still set <code>role="dialog"</code>, <code>aria-modal</code> and an Escape-to-close handler.</p></blockquote>`,
        `<blockquote><p><strong>Q: When would you use <code>LiveAnnouncer</code> vs just showing a toast?</strong> A toast is visual only. <code>LiveAnnouncer</code> writes into an ARIA live region so screen-reader users hear dynamic changes that have no focus target — "row deleted", "saved". Use <code>polite</code> normally; <code>assertive</code> only for urgent interruptions.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): After a drag-drop the item jumps back to its original spot. Why?</strong> The CDK moves the DOM but never mutates your data. You must update the backing arrays in <code>(cdkDropListDropped)</code> with <code>moveItemInArray</code> or <code>transferArrayItem</code>; otherwise the next render restores the DOM from the unchanged model.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you move an item between two lists?</strong> Connect them with <code>cdkDropListConnectedTo</code> (or a <code>cdkDropListGroup</code>), then in the drop handler branch on <code>previousContainer === container</code>: same list → <code>moveItemInArray</code>, different lists → <code>transferArrayItem</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is <code>FocusMonitor</code> for?</strong> It reports how an element received focus (mouse/keyboard/touch/program) and stamps origin classes, so you can show focus rings for keyboard users only — accessible behaviour without deleting outlines for everyone. Remember to <code>stopMonitoring</code> to avoid leaks.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): Is CDK drag-drop accessible by default?</strong> Pointer dragging works out of the box, but full keyboard drag-and-drop and screen-reader announcements aren't automatic — you add ARIA and, for non-pointer users, an alternative reorder mechanism plus <code>LiveAnnouncer</code> feedback. Don't assume it's a11y-complete just because it drags.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>FocusTrap:</strong> <code>cdkTrapFocus</code> (+<code>AutoCapture</code>) loops Tab inside a modal; add <code>role</code>/<code>aria-modal</code>/Esc yourself.</li>`,
        `<li><strong>LiveAnnouncer:</strong> <code>announce(msg, 'polite'|'assertive')</code> for non-focus changes.</li>`,
        `<li><strong>FocusMonitor:</strong> <code>monitor(el)</code> → focus origin; <code>stopMonitoring</code> on destroy.</li>`,
        `<li><strong>Drag-drop:</strong> <code>cdkDrag</code> in <code>cdkDropList</code>; connect via <code>cdkDropListConnectedTo</code>/<code>cdkDropListGroup</code>.</li>`,
        `<li><strong>On drop:</strong> same list → <code>moveItemInArray</code>; across lists → <code>transferArrayItem</code>. CDK never mutates your data.</li>`,
        `<li><strong>Golden rule:</strong> DOM moves are the CDK's job; the data model is yours.</li>`,
        `</ul>`,
      ].join('\n')
    },

    {
      title: 'CDK Virtual Scrolling',
      slug: 'virtual-scrolling',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Rendering a list of 10,000 rows the naive way creates 10,000 DOM nodes, blows up initial render time, hammers change detection on every tick, and janks on scroll. Virtual scrolling is the standard fix: render only the handful of items actually visible (plus a small buffer) and recycle those nodes as the user scrolls. The CDK's <code>ScrollingModule</code> ships a production-grade implementation, and knowing when and how to use it is a routine performance question — "you have a table with 50k rows, it's slow, what do you do?" The expected first answer is virtual scrolling.</p>`,
        `<p>It also probes a deeper understanding of the DOM and change detection. Candidates who can explain <em>why</em> fewer nodes helps (less layout, less paint, dramatically fewer bindings to check per CD cycle) and can reason about the trade-offs — fixed vs variable item heights, buffer sizing, the loss of native in-page find, sticky headers — demonstrate they understand rendering cost, not just an API. This topic ties the whole chapter together: it is the CDK solving a performance problem the same way Overlay solves a positioning problem.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>You wrap your list in a <code>&lt;cdk-virtual-scroll-viewport&gt;</code> and swap <code>*ngFor</code>/<code>@for</code> for <code>*cdkVirtualFor</code>. The viewport measures its own height, figures out which slice of the data is currently on screen, and renders only those items into the DOM. As you scroll, items that leave the view are removed (their nodes recycled for incoming items) and a tall spacer keeps the scrollbar the size the full list <em>would</em> be, so scrolling feels normal even though only a few nodes exist.</p>`,
        `{{fig:ch12-virtual-scroll.svg|A 10,000-item dataset with only the visible window plus buffer rendered as recycled DOM nodes, and a spacer preserving scroll height|The viewport renders only the visible range plus a small buffer as recycled DOM nodes and offsets them with transforms; a spacer sized itemSize times count preserves the real scrollbar height.}}`,
        `<p>The core idea is a <strong>window</strong> over your data. The data array can be enormous, but the number of live DOM nodes stays roughly constant — proportional to the viewport size, not the dataset size. That is what turns "10,000 rows" from an O(n) rendering cost into an effectively O(visible) one.</p>`,

        `<h2>How it works</h2>`,
        `<p><strong>The viewport and the strategy.</strong> <code>cdk-virtual-scroll-viewport</code> owns a scrollable region and delegates "which items are visible?" to a <em>scroll strategy</em>. The built-in <code>FixedSizeVirtualScrollStrategy</code> (configured via the <code>itemSize</code> input) assumes every item is the same pixel height. Knowing the fixed height lets it compute the visible range with pure arithmetic: <code>startIndex = floor(scrollOffset / itemSize)</code>, and the count is <code>ceil(viewportHeight / itemSize)</code> plus buffers — no measuring each row. That math is why fixed-size virtual scrolling is cheap and exact.</p>`,
        `<p><strong>Rendering the window.</strong> <code>*cdkVirtualFor</code> renders only the items in the computed range. Rather than absolutely positioning each row, the strategy translates the rendered block with a CSS <code>transform: translateY(offset)</code> so the visible items sit at the right scroll position. A spacer element (total height = <code>itemSize × itemCount</code>) sits behind them to give the scrollbar its correct length and range. As the user scrolls past the buffer, the range shifts, and <code>cdkVirtualFor</code> reuses the existing views for the new items (view recycling) instead of destroying and recreating DOM — the same idea as <code>trackBy</code>, applied to windowing.</p>`,
        `<p><strong>Buffers.</strong> Two inputs tune how aggressively it renders ahead: <code>minBufferPx</code> (render more when the buffered content drops below this) and <code>maxBufferPx</code> (how far ahead to render when it does). A larger buffer means fewer re-render events during fast scrolling (smoother) at the cost of more nodes; too small a buffer shows blank gaps during a fling. You tune these for your row height and scroll speed.</p>`,
        `<p><strong>Data sources.</strong> <code>cdkVirtualFor</code> accepts a plain array, an <code>Observable&lt;T[]&gt;</code>, or a <code>DataSource</code>. The <code>DataSource</code> abstraction lets you stream ranges on demand — the viewport exposes the currently-rendered range (<code>viewChange</code>), so a data source can fetch just those items from a server, enabling virtual scrolling over data too large to hold in memory at all.</p>`,
        `<p><strong>Variable heights.</strong> The built-in strategy is fixed-size. For rows of differing heights you either estimate an average <code>itemSize</code> (accepting slightly imperfect scrollbar behaviour), implement a custom <code>VirtualScrollStrategy</code>, or use the <code>autosize</code> strategy from <code>@angular/cdk-experimental</code> (which measures rendered items). This trade-off — fixed size is exact and cheap, variable size needs measurement and is heavier — is a classic follow-up question.</p>`,
        `<p><strong>Why it speeds things up.</strong> Fewer DOM nodes means less layout and paint, lower memory, and — critically for Angular — far fewer template bindings for change detection to check each tick. A 10k-row list checked on every CD cycle is a huge cost; a 15-node window is negligible. Combine it with <code>OnPush</code> on the row component and the per-tick work becomes trivial.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. Fixed-size virtual scroll over a large array.</strong></p>`,
        `<pre><code class="language-typescript">import { Component } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-big-list',
  standalone: true,
  imports: [ScrollingModule],
  template: \`
    &lt;cdk-virtual-scroll-viewport itemSize="48" class="viewport"&gt;
      &lt;div *cdkVirtualFor="let item of items; trackBy: trackById" class="row"&gt;
        {{ item.id }} — {{ item.name }}
      &lt;/div&gt;
    &lt;/cdk-virtual-scroll-viewport&gt;
  \`,
  styles: [\`.viewport { height: 400px; } .row { height: 48px; }\`],
})
export class BigListComponent {
  items = Array.from({ length: 10_000 }, (_, i) =&gt; ({ id: i, name: 'Row ' + i }));
  trackById = (_: number, it: { id: number }) =&gt; it.id;
}</code></pre>`,
        `<p><strong>2. Tuning buffers for fast scrolling.</strong></p>`,
        `<pre><code class="language-html">&lt;cdk-virtual-scroll-viewport
  itemSize="60"
  minBufferPx="600"
  maxBufferPx="1200"
  class="viewport"&gt;
  &lt;div *cdkVirtualFor="let row of rows; trackBy: trackById"&gt;{{ row.title }}&lt;/div&gt;
&lt;/cdk-virtual-scroll-viewport&gt;</code></pre>`,
        `<p><strong>3. Virtual scroll fed by an Observable, with OnPush rows.</strong></p>`,
        `<pre><code class="language-typescript">import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { AsyncPipe } from '@angular/common';
import { UsersService } from './users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollingModule, AsyncPipe],
  template: \`
    &lt;cdk-virtual-scroll-viewport itemSize="56" class="viewport"&gt;
      &lt;div *cdkVirtualFor="let u of users$ | async; trackBy: trackById" class="row"&gt;
        {{ u.name }}
      &lt;/div&gt;
    &lt;/cdk-virtual-scroll-viewport&gt;
  \`,
})
export class UsersComponent {
  users$ = inject(UsersService).getAll(); // Observable&lt;User[]&gt;
  trackById = (_: number, u: { id: string }) =&gt; u.id;
}</code></pre>`,
        `<p><strong>4. Reading the rendered range to lazily fetch data.</strong></p>`,
        `<pre><code class="language-typescript">// Inside a component with a @ViewChild(CdkVirtualScrollViewport) viewport
this.viewport.renderedRangeStream.subscribe(range =&gt; {
  // range: { start, end } — fetch just these rows from the server
  this.loadRange(range.start, range.end);
});</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Not giving the viewport an explicit height.</strong> <code>cdk-virtual-scroll-viewport</code> must have a bounded height (or fill a flex parent) or it can't compute the visible range and renders nothing / everything.</li>`,
        `<li><strong>Mismatched <code>itemSize</code> and real row height.</strong> If <code>itemSize</code> lies about the actual pixel height, items overlap or leave gaps and the scrollbar is wrong. Keep them in sync.</li>`,
        `<li><strong>Variable-height rows with the fixed strategy.</strong> The built-in strategy assumes uniform height; ragged rows misplace content. Use an estimate, a custom strategy, or the experimental autosize.</li>`,
        `<li><strong>Missing <code>trackBy</code>.</strong> Without a stable identity, recycled views can't be matched to items efficiently, hurting the very performance you added virtual scroll for.</li>`,
        `<li><strong>Expecting Ctrl+F / in-page find to work.</strong> Off-screen items aren't in the DOM, so native browser find and anchor scrolling don't see them — a real UX trade-off to communicate.</li>`,
        `<li><strong>Sticky headers / grouped lists.</strong> These need extra care (sticky positioning inside the viewport, or a custom strategy) — they don't come free.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Use virtual scrolling once lists get into the hundreds/thousands</strong> of rows — below that the overhead isn't worth it.</li>`,
        `<li><strong>Give the viewport a fixed/bounded height and match <code>itemSize</code> to the real row height</strong> exactly for fixed-size lists.</li>`,
        `<li><strong>Always provide a stable <code>trackBy</code></strong> so view recycling works and rows aren't rebuilt.</li>`,
        `<li><strong>Pair with <code>OnPush</code> row components</strong> so each tick checks only the small visible window.</li>`,
        `<li><strong>Tune <code>minBufferPx</code>/<code>maxBufferPx</code></strong> for your row height and scroll speed — bigger buffers for fast flings, smaller for lighter DOM.</li>`,
        `<li><strong>Use <code>renderedRangeStream</code> + a <code>DataSource</code></strong> to fetch only visible rows for datasets too large to hold in memory.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What is virtual scrolling and why is it faster?</strong> It renders only the items currently visible (plus a buffer) and recycles their DOM nodes as you scroll, keeping the live node count proportional to the viewport, not the dataset. Fewer nodes means less layout/paint, less memory, and dramatically fewer bindings for change detection to check each tick.</p></blockquote>`,
        `<blockquote><p><strong>Q: How does the fixed-size strategy know what to render?</strong> Because every item has the same <code>itemSize</code>, it computes the range arithmetically: <code>startIndex = floor(scrollOffset / itemSize)</code> and count ≈ <code>ceil(viewportHeight / itemSize)</code> plus buffer. It offsets the rendered block with <code>transform: translateY</code> and a spacer of height <code>itemSize × count</code> preserves the scrollbar.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): Why does my virtual scroll render nothing or everything?</strong> The viewport almost certainly has no bounded height. <code>cdk-virtual-scroll-viewport</code> needs an explicit height (or to fill a flex parent) to compute the visible range.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you handle variable-height rows?</strong> The built-in strategy is fixed-size. Options: estimate an average <code>itemSize</code> (imperfect scrollbar), write a custom <code>VirtualScrollStrategy</code>, or use the experimental autosize strategy that measures rendered items. Fixed size is exact and cheap; measured is heavier.</p></blockquote>`,
        `<blockquote><p><strong>Q: What are the downsides of virtual scrolling?</strong> Off-screen items aren't in the DOM, so native Ctrl+F, anchor links and screen-reader traversal of the whole list break; sticky headers and grouped lists need extra work; and item height must be known or measured. It's a trade of some capability for scale.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): Does virtual scrolling replace <code>trackBy</code> and <code>OnPush</code>?</strong> No — it complements them. <code>trackBy</code> lets it recycle views correctly, and <code>OnPush</code> on the row keeps the per-tick check of the visible window tiny. They stack; virtual scroll alone with Default CD and no trackBy leaves performance on the table.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Setup:</strong> <code>&lt;cdk-virtual-scroll-viewport itemSize="48"&gt;</code> + <code>*cdkVirtualFor</code> (from <code>ScrollingModule</code>).</li>`,
        `<li><strong>Idea:</strong> render only the visible window + buffer, recycle nodes, spacer preserves scroll height.</li>`,
        `<li><strong>Fixed strategy math:</strong> start = <code>floor(offset / itemSize)</code>; nodes ≈ viewport/itemSize + buffer.</li>`,
        `<li><strong>Must-haves:</strong> bounded viewport height · accurate <code>itemSize</code> · stable <code>trackBy</code>.</li>`,
        `<li><strong>Tune:</strong> <code>minBufferPx</code>/<code>maxBufferPx</code>; pair with <code>OnPush</code> rows.</li>`,
        `<li><strong>Trade-offs:</strong> no native find/anchor for off-screen rows; variable heights need autosize/custom strategy.</li>`,
        `</ul>`,
      ].join('\n')
    },
  ]
};
