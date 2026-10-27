from dataclasses import dataclass, field
@dataclass
class Provider:
    name: str
    models: list[Model] = field(default_factory=list)

#can ignore model not being defined, define it whenever you create a provider in another file not here