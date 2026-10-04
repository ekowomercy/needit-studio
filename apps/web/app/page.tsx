import {
  Avatar,
  Badge,
  Button,
  Chip,
  EmptyState,
  Price,
  Rating,
  Skeleton,
} from '@needit/ui';
import { ThemeToggle } from '@/components/theme-toggle';

const CATEGORIES = [
  { icon: '🔧', label: 'Home Services' },
  { icon: '📱', label: 'Used Items' },
  { icon: '👩🏫', label: 'Tutors' },
  { icon: '🎨', label: 'Designers' },
  { icon: '🧹', label: 'Cleaning' },
  { icon: '🔩', label: 'Repairs' },
  { icon: '💄', label: 'Beauty' },
  { icon: '🚚', label: 'Transport' },
  { icon: '🎉', label: 'Events' },
];

const EXAMPLES = [
  'I need a plumber tomorrow.',
  'I need a used fridge under ₦150,000.',
  'I need someone to design a flyer.',
  'I need a maths tutor for my child.',
];

export default function HomePage() {
  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 20px 80px' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <span className="text-overline">NeedIt Studio · Phase 0 reference</span>
          <h1 className="text-display" style={{ margin: '4px 0 0' }}>
            What do you need?
          </h1>
        </div>
        <ThemeToggle />
      </header>

      {/* Hero */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--p-700), var(--p-500))',
          border: 'none',
          borderRadius: 18,
          padding: '30px 26px',
          color: '#fff',
        }}
      >
        <p className="text-title-md" style={{ margin: 0 }}>
          Tell us naturally — we’ll find the people, products &amp; services.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <input
            className="input"
            aria-label="What do you need?"
            placeholder="Tell us what you need…"
            style={{ flex: '1 1 260px', minWidth: 260 }}
            defaultValue="I need a used washing machine under ₦150k"
          />
          <Button size="lg">Find it</Button>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
          {EXAMPLES.map((e) => (
            <span key={e} style={{ fontSize: 13, opacity: 0.9 }}>
              💬 “{e}”
            </span>
          ))}
        </div>
      </div>

      {/* Popular needs */}
      <section style={{ marginTop: 28 }}>
        <h2 className="text-title-md" style={{ margin: '0 0 12px' }}>
          Popular needs
        </h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <Chip key={c.label} variant="category">
              {c.icon} {c.label}
            </Chip>
          ))}
        </div>
      </section>

      {/* Sample results */}
      <section style={{ marginTop: 32 }}>
        <h2 className="text-title-md" style={{ margin: '0 0 12px' }}>
          Sample results
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          {/* person card */}
          <div className="card">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Avatar name="Musa Bello" size="lg" verified />
              <div>
                <b className="text-title-sm">Musa Bello</b>
                <div className="text-caption">Plumber · Ikeja, Lagos</div>
              </div>
            </div>
            <div className="text-body-sm" style={{ margin: '10px 0' }}>
              Fixing taps, pipes, toilets and water heaters.
            </div>
            <Badge variant="availability">Available tomorrow</Badge>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <Rating value={4.9} count={214} />
              <Price kobo={800_000} suffix="starting" />
            </div>
            <Button block style={{ marginTop: 12 }} size="sm">
              Book / Contact
            </Button>
          </div>

          {/* product card */}
          <div className="card">
            <div
              style={{
                height: 90,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #c9d6ff, #8aa7ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 34,
              }}
            >
              🧺
            </div>
            <b className="text-title-sm" style={{ display: 'block', marginTop: 10 }}>
              Used washing machine
            </b>
            <div className="text-caption" style={{ margin: '4px 0' }}>
              Lekki, Lagos · Gift’s Store
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Badge variant="neutral">Used · Fair</Badge>
              <Price kobo={13_500_000} />
            </div>
            <Button block style={{ marginTop: 12 }} size="sm" variant="secondary">
              Contact seller
            </Button>
          </div>

          {/* service card */}
          <div className="card">
            <div
              style={{
                height: 90,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #ffe1c2, #ffb36b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 34,
              }}
            >
              🎨
            </div>
            <b className="text-title-sm" style={{ display: 'block', marginTop: 10 }}>
              Flyer design
            </b>
            <div className="text-caption" style={{ margin: '4px 0' }}>
              Online · Lagos
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Rating value={4.6} count={89} />
              <Price kobo={1_500_000} />
            </div>
            <Button block style={{ marginTop: 12 }} size="sm">
              Hire designer
            </Button>
          </div>

          {/* empty / loading demo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <EmptyState
              icon="🔍"
              title="No results yet"
              description="This stays active as a NeedIt Request — we’ll notify you when someone can help."
              action={<Button size="sm" variant="secondary">Edit request</Button>}
            />
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton style={{ height: 14, width: '60%' }} />
              <Skeleton style={{ height: 14, width: '80%' }} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}