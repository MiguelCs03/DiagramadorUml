import type { UMLDiagram, UMLEntity, UMLRelation, UMLAttribute } from '../types/uml';

interface GeneratedFile {
  filename: string;
  content: string;
  type: 'entity' | 'repository' | 'service' | 'controller' | 'dto';
}

export class SpringBootCodeGenerator {
  private diagram: UMLDiagram;
  private packageName: string;

  constructor(diagram: UMLDiagram, packageName = 'com.example.demo') {
    this.diagram = diagram;
    this.packageName = packageName;
  }

  generateAll(): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // Filter only class entities (exclude intermediate tables)
    const classEntities = this.diagram.entities.filter(entity => 
      entity.type === 'class' || entity.type === 'abstract'
    );

    // Generate files for each class entity
    classEntities.forEach((entity) => {
      files.push(this.generateEntity(entity));
      files.push(this.generateRepository(entity));
      files.push(this.generateService(entity));
      files.push(this.generateController(entity));
      files.push(this.generateDTO(entity));
    });

    return files;
  }

  private generateEntity(entity: UMLEntity): GeneratedFile {
    const className = this.capitalize(entity.name);
    const relations = this.getRelationsForEntity(entity.id);

    let content = `package ${this.packageName}.entity;

import jakarta.persistence.*;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "${this.toSnakeCase(entity.name)}")
public class ${className} {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
`;

    // Generate attributes
    entity.attributes.forEach((attr) => {
      const javaType = this.mapDataType(attr.type);
      const columnAnnotation = attr.isKey && attr.name !== 'id' 
        ? `@Column(name = "${this.toSnakeCase(attr.name)}", unique = true)`
        : `@Column(name = "${this.toSnakeCase(attr.name)}")`;
      
      content += `
    ${columnAnnotation}
    private ${javaType} ${attr.name};
`;
    });

    // Generate relationships
    relations.forEach((relation) => {
      const relatedEntity = this.diagram.entities.find(
        (ent) => ent.id === (relation.source === entity.id ? relation.target : relation.source)
      );

      if (relatedEntity && relatedEntity.type !== 'intermediate') {
        const relatedClassName = this.capitalize(relatedEntity.name);
        this.addRelationshipAnnotation(content, entity, relatedEntity, relation);
      }
    });

    // Generate constructors
    content += `
    public ${className}() {}

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
`;

    // Generate getters and setters for attributes
    entity.attributes.forEach((attr) => {
      const javaType = this.mapDataType(attr.type);
      const capitalizedName = this.capitalize(attr.name);

      content += `
    public ${javaType} get${capitalizedName}() {
        return ${attr.name};
    }

    public void set${capitalizedName}(${javaType} ${attr.name}) {
        this.${attr.name} = ${attr.name};
    }
`;
    });

    content += `
}`;

    return {
      filename: `${className}.java`,
      content,
      type: 'entity',
    };
  }

  private addRelationshipAnnotation(content: string, entity: UMLEntity, relatedEntity: UMLEntity, relation: UMLRelation): void {
    const relatedClassName = this.capitalize(relatedEntity.name);
    const isSource = relation.source === entity.id;
    const sourceCard = relation.sourceCardinality;
    const targetCard = relation.targetCardinality;
    
    const isOneToMany = (sourceCard.max === 1) && (targetCard.max === 'unlimited' || targetCard.max > 1);
    const isManyToOne = (sourceCard.max === 'unlimited' || sourceCard.max > 1) && (targetCard.max === 1);
    const isManyToMany = (sourceCard.max === 'unlimited' || sourceCard.max > 1) && (targetCard.max === 'unlimited' || targetCard.max > 1);
    const isOneToOne = sourceCard.max === 1 && targetCard.max === 1;

    if (relation.type === 'inheritance' && !isSource) {
      // Child class extends parent
      content = content.replace(
        `public class ${this.capitalize(entity.name)} {`,
        `public class ${this.capitalize(entity.name)} extends ${relatedClassName} {`
      );
    } else if (relation.type === 'composition' || relation.type === 'aggregation' || relation.type === 'association') {
      if (isManyToMany) {
        content += `
    @ManyToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinTable(
        name = "${this.toSnakeCase(entity.name)}_${this.toSnakeCase(relatedEntity.name)}",
        joinColumns = @JoinColumn(name = "${this.toSnakeCase(entity.name)}_id"),
        inverseJoinColumns = @JoinColumn(name = "${this.toSnakeCase(relatedEntity.name)}_id")
    )
    private Set<${relatedClassName}> ${this.toLowerCamelCase(relatedEntity.name)}Set = new HashSet<>();
`;
      } else if (isOneToMany && isSource) {
        content += `
    @OneToMany(mappedBy = "${this.toLowerCamelCase(entity.name)}", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<${relatedClassName}> ${this.toLowerCamelCase(relatedEntity.name)}Set = new HashSet<>();
`;
      } else if (isManyToOne && !isSource) {
        content += `
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "${this.toSnakeCase(relatedEntity.name)}_id")
    private ${relatedClassName} ${this.toLowerCamelCase(relatedEntity.name)};
`;
      } else if (isOneToOne) {
        content += `
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "${this.toSnakeCase(relatedEntity.name)}_id")
    private ${relatedClassName} ${this.toLowerCamelCase(relatedEntity.name)};
`;
      }
    }
  }

  private generateRepository(entity: UMLEntity): GeneratedFile {
    const className = this.capitalize(entity.name);

    const content = `package ${this.packageName}.repository;

import ${this.packageName}.entity.${className};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ${className}Repository extends JpaRepository<${className}, Long> {
    
    // Custom query methods based on attributes
${entity.attributes.filter(attr => attr.type === 'String').map(attr => 
    `    List<${className}> findBy${this.capitalize(attr.name)}ContainingIgnoreCase(String ${attr.name});`
).join('\n')}
${entity.attributes.filter(attr => attr.isKey && attr.name !== 'id').map(attr => 
    `    Optional<${className}> findBy${this.capitalize(attr.name)}(${this.mapDataType(attr.type)} ${attr.name});`
).join('\n')}
    
    @Query("SELECT e FROM ${className} e WHERE e.id = :id")
    Optional<${className}> findByIdWithDetails(@Param("id") Long id);
}`;

    return {
      filename: `${className}Repository.java`,
      content,
      type: 'repository',
    };
  }

  private generateService(entity: UMLEntity): GeneratedFile {
    const className = this.capitalize(entity.name);
    const lowerClassName = this.toLowerCamelCase(className);

    const content = `package ${this.packageName}.service;

import ${this.packageName}.entity.${className};
import ${this.packageName}.repository.${className}Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ${className}Service {
    
    @Autowired
    private ${className}Repository ${lowerClassName}Repository;
    
    @Transactional(readOnly = true)
    public List<${className}> findAll() {
        return ${lowerClassName}Repository.findAll();
    }
    
    @Transactional(readOnly = true)
    public Optional<${className}> findById(Long id) {
        return ${lowerClassName}Repository.findById(id);
    }
    
    @Transactional(readOnly = true)
    public Optional<${className}> findByIdWithDetails(Long id) {
        return ${lowerClassName}Repository.findByIdWithDetails(id);
    }
    
    public ${className} save(${className} ${lowerClassName}) {
        return ${lowerClassName}Repository.save(${lowerClassName});
    }
    
    public ${className} update(Long id, ${className} ${lowerClassName}) {
        ${lowerClassName}.setId(id);
        return ${lowerClassName}Repository.save(${lowerClassName});
    }
    
    public void deleteById(Long id) {
        ${lowerClassName}Repository.deleteById(id);
    }
    
    public boolean existsById(Long id) {
        return ${lowerClassName}Repository.existsById(id);
    }
${entity.attributes.filter(attr => attr.type === 'String').map(attr => `
    @Transactional(readOnly = true)
    public List<${className}> searchBy${this.capitalize(attr.name)}(String ${attr.name}) {
        return ${lowerClassName}Repository.findBy${this.capitalize(attr.name)}ContainingIgnoreCase(${attr.name});
    }`
).join('')}
}`;

    return {
      filename: `${className}Service.java`,
      content,
      type: 'service',
    };
  }

  private generateController(entity: UMLEntity): GeneratedFile {
    const className = this.capitalize(entity.name);
    const lowerClassName = this.toLowerCamelCase(className);
    const pluralName = lowerClassName + 's';

    const content = `package ${this.packageName}.controller;

import ${this.packageName}.entity.${className};
import ${this.packageName}.service.${className}Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/${pluralName}")
@CrossOrigin(origins = "*")
public class ${className}Controller {
    
    @Autowired
    private ${className}Service ${lowerClassName}Service;
    
    @GetMapping
    public ResponseEntity<List<${className}>> getAll${className}s() {
        try {
            List<${className}> ${pluralName} = ${lowerClassName}Service.findAll();
            return ResponseEntity.ok(${pluralName});
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<${className}> get${className}ById(@PathVariable Long id) {
        try {
            Optional<${className}> ${lowerClassName} = ${lowerClassName}Service.findByIdWithDetails(id);
            return ${lowerClassName}
                .map(entity -> ResponseEntity.ok(entity))
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping
    public ResponseEntity<${className}> create${className}(@Valid @RequestBody ${className} ${lowerClassName}) {
        try {
            ${className} saved${className} = ${lowerClassName}Service.save(${lowerClassName});
            return ResponseEntity.status(HttpStatus.CREATED).body(saved${className});
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<${className}> update${className}(@PathVariable Long id, @Valid @RequestBody ${className} ${lowerClassName}) {
        try {
            if (!${lowerClassName}Service.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            ${className} updated${className} = ${lowerClassName}Service.update(id, ${lowerClassName});
            return ResponseEntity.ok(updated${className});
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete${className}(@PathVariable Long id) {
        try {
            if (!${lowerClassName}Service.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            ${lowerClassName}Service.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
${entity.attributes.filter(attr => attr.type === 'String').map(attr => `
    @GetMapping("/search")
    public ResponseEntity<List<${className}>> searchBy${this.capitalize(attr.name)}(@RequestParam String ${attr.name}) {
        try {
            List<${className}> results = ${lowerClassName}Service.searchBy${this.capitalize(attr.name)}(${attr.name});
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }`
).join('')}
}`;

    return {
      filename: `${className}Controller.java`,
      content,
      type: 'controller',
    };
  }

  private generateDTO(entity: UMLEntity): GeneratedFile {
    const className = this.capitalize(entity.name);
    const dtoClassName = `${className}DTO`;

    let content = `package ${this.packageName}.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.UUID;

public class ${dtoClassName} {
    
    private Long id;
`;

    // Generate attributes
    entity.attributes.forEach((attr) => {
      const javaType = this.mapDataType(attr.type);
      content += `    private ${javaType} ${attr.name};\n`;
    });

    // Generate constructors
    content += `
    public ${dtoClassName}() {}

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
`;

    // Generate getters and setters for attributes
    entity.attributes.forEach((attr) => {
      const javaType = this.mapDataType(attr.type);
      const capitalizedName = this.capitalize(attr.name);

      content += `
    public ${javaType} get${capitalizedName}() {
        return ${attr.name};
    }

    public void set${capitalizedName}(${javaType} ${attr.name}) {
        this.${attr.name} = ${attr.name};
    }
`;
    });

    content += `
}`;

    return {
      filename: `${dtoClassName}.java`,
      content,
      type: 'dto',
    };
  }

  private getRelationsForEntity(entityId: string): UMLRelation[] {
    return this.diagram.relations.filter(
      (relation) => relation.source === entityId || relation.target === entityId
    );
  }

  private mapDataType(dataType: string): string {
    switch (dataType) {
      case 'String':
      case 'Text':
        return 'String';
      case 'Integer':
        return 'Integer';
      case 'Long':
        return 'Long';
      case 'Double':
        return 'Double';
      case 'Float':
        return 'Float';
      case 'Boolean':
        return 'Boolean';
      case 'Date':
        return 'LocalDate';
      case 'DateTime':
        return 'LocalDateTime';
      case 'BigDecimal':
        return 'BigDecimal';
      case 'UUID':
        return 'UUID';
      default:
        return 'String';
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private toLowerCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }
}

export function generateSpringBootCode(diagram: UMLDiagram, packageName?: string): GeneratedFile[] {
  const generator = new SpringBootCodeGenerator(diagram, packageName);
  return generator.generateAll();
}